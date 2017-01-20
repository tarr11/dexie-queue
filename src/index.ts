import Dexie from 'dexie';

interface Job {
  expires_at?: Date
  value : any,
  fn : any,
}

class SerializedJob {
  static Parse(sj : SerializedJob) : Job {
    let fn = Function(sj.fn);
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
            contacts: '++id'
        });
    }
}

class Queue {
  private db : Database;

  public Enqueue(job: Job, fn: JobFunction) : Promise<number> {
    let s : SerializedJob = {
      expires_at: job.expires_at,
      fn : fn.toString(),
      value: JSON.stringify(job)
    };
    return this.db.jobs.add(s)
  }

  private poll(){
    this.db.jobs.orderBy("id desc").each(job => {
      let res = SerializedJob.Parse(job);
      try {
        res.fn(res.value);
        this.db.jobs.delete(job.id);
      }
      catch (e) {
        this.db.jobs.update(job.id, { error: e })
      }
    }).then(() =>
      setTimeout(this.poll, 1000)
    );

  }

  public Start() {
    this.db = new Database();
    return this.db.open().then(() =>
      this.poll()
    );
  }

  public Stop() : void {
    this.db.close();
  }

}

let queue = new Queue();
export default Queue;
