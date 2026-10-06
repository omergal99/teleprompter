export class Camera{
 constructor(video){this.v=video;this.stream=null;this.rec=null;this.chunks=[]}
 get on(){return !!this.stream}
 async start(facing='user'){this.stop();let s;
  try{s=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1920},height:{ideal:1080}},audio:true})}
  catch{s=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing}})}
  this.stream=s;this.v.srcObject=s;this.v.style.transform=facing==='user'?'scaleX(-1)':'none';await this.v.play().catch(()=>{})}
 stop(){this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.v.srcObject=null}
 startRec(){const types=['video/mp4;codecs=avc1','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const mimeType=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));this.chunks=[];
  this.rec=new MediaRecorder(this.stream,mimeType?{mimeType}:undefined);this.rec.ondataavailable=e=>e.data.size&&this.chunks.push(e.data);this.rec.start(1000)}
 stopRec(){return new Promise(res=>{const r=this.rec;r.onstop=()=>{const type=r.mimeType||'video/webm';res({blob:new Blob(this.chunks,{type}),ext:type.includes('mp4')?'mp4':'webm'})};r.stop();this.rec=null})}
 get recording(){return this.rec?.state==='recording'}
}
