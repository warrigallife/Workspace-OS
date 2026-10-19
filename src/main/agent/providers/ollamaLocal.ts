import http from 'http'
/** Fixed loopback HTTP: no proxy, auth, redirects, environment inheritance or cloud fallback. */
export function localOllama(route:'/api/tags'|'/api/chat', body:unknown, signal:AbortSignal):Promise<any> {
  return new Promise((resolve,reject)=>{
    signal.throwIfAborted()
    const raw=body===null?undefined:JSON.stringify(body)
    const req=http.request({hostname:'127.0.0.1',port:11434,path:route,method:raw?'POST':'GET',signal,headers:raw?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(raw)}:{}},res=>{
      const chunks:Buffer[]=[];let size=0
      res.on('data',chunk=>{size+=chunk.length;if(size>262144)req.destroy(new Error('Local response limit'));else chunks.push(chunk)})
      res.on('error',reject)
      res.on('end',()=>{try {if(res.statusCode!==200)throw new Error('Local Ollama HTTP '+res.statusCode);resolve(JSON.parse(Buffer.concat(chunks).toString()))}catch(e){reject(e)}})
    })
    req.setTimeout(90000,()=>req.destroy(new Error('Local inference timeout')));req.on('error',reject);req.end(raw)
  })
}
