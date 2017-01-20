import Dexie from 'dexie';

interface Job {
  expires_at?: Date
  value : any,
  fn : any,
}

class SerializedJob {
  static Parse(sj : SerializedJob) : Job {
    let fnBody = "var fn = " + sj.fn + "; fn(obj);"
    let fn = Function("obj", fnBody);
    let obj = JSON.parse(sj.value)
    return {
      expires_at: sj.expires_at,
      fn: fn,
      value: obj
    };
  }
  id? : number;
  expires_at?: Date;
  fn: string;
  value: string;
  error?: string;
}

type JobFunction = (job: Job) => void;

// Subclass it
class Database extends Dexie {
    jobs: Dexie.Table<SerializedJob, number>;

    constructor () {
        super("dexie-queue");
        this.version(1).stores({
            jobs: '++id'
        });
    }
}

class JobQueue { 
  public db : Database;

  public Enqueue(job: Job) : Promise<number> {
    let s : SerializedJob = {
      expires_at: job.expires_at,
      fn : job.fn.toString(),
      value: JSON.stringify(job)
    };
    return this.db.jobs.add(s)
  }

  private static poll(queue: JobQueue){
    let db = queue.db;
    let ids : Array<number>= [];
    queue.db.jobs.each(job => {
      let res = SerializedJob.Parse(job);
      try {
        let retVal = res.fn(res.value);
        ids.push(job.id);
      }
      catch (e) {
        console.log(e);
        db.jobs.update(job.id, { error: e })
      }
    }).then(() =>
      // delete all the jobs we finished
      {
      db.jobs.bulkDelete(ids).catch(err => console.log(err))
      setTimeout(() => JobQueue.poll(queue), 1000);
      }
    );

  }

  public Start() {
    this.db = new Database();
    return this.db.open().then(() =>
      JobQueue.poll(this)
    );
  }

  public Stop() : void {
    this.db.close();
  }

}

let jobQueue = new JobQueue();
export default jobQueue;
