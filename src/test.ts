import jobQueue from './index';

let fn = (obj: any) => console.log("DOING IT" + obj.value.thing);
let job = { value: { thing: 1}, fn: fn };
let job2 = { value: { thing: 2}, fn: fn };

jobQueue.Start().then(() => {
  jobQueue.Enqueue(job);
  window.setTimeout(() => jobQueue.Enqueue(job2), 2000);
}
);

