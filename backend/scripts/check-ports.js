const fetch = require('node-fetch');
(async ()=>{
  for (const port of [5001,5000]){
    const url = `http://localhost:${port}/api/public/questions`;
    try{
      const res = await fetch(url, { method: 'GET', timeout: 5000 });
      const text = await res.text();
      console.log(`${port} OK ${res.status} len=${text.length}`);
    }catch(e){
      console.log(`${port} ERR ${e.message}`);
    }
  }
})();
