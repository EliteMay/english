init().catch(err=>{console.error(err);document.body.innerHTML=`<pre style="color:white;padding:30px">読み込みエラー: ${esc(err.message)}\nGitHub Pagesから開いてください。</pre>`});
