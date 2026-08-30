(()=>{
  const fail=err=>{console.error(err);document.body.innerHTML=`<pre style="color:white;padding:30px">読み込みエラー: ${esc(err.message)}\nGitHub Pagesから開いてください。</pre>`};
  const start=()=>init().catch(fail);
  const build=encodeURIComponent(window.EnglishWorksheetBuild?.build||Date.now());
  const link=document.createElement('link');link.rel='stylesheet';link.href=`./css/pedagogy-v053.css?b=${build}`;document.head.append(link);
  const script=document.createElement('script');script.src=`./js/pedagogy-v053.js?b=${build}`;script.onload=start;script.onerror=()=>{console.warn('pedagogy-v053.js を読み込めませんでした。基本機能で起動します。');start()};document.head.append(script);
})();
