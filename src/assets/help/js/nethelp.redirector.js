(function(){var f;if(!/\Wnhr=false(\W|$)/i.test(location.href)&&!window.top.nethelp||/\Wnhr=true(\W|$)/i.test(location.href)){var n="../",e=document,u=location,t,o=u.hash,r=u.search||"",s=e.getElementsByTagName("script"),h=s[s.length-1],c=/(.*)nethelp\.redirector\.js$/i.exec(h.src)[1],i=e.createElement("a");i.href=".",f=i.href==="."?function(n){return i.href=n,i.getAttribute("href",4)}:function(n){return i.setAttribute("href",n),i.href},t=f("#").replace(/(\?.*|#)$/,""),n=h.getAttribute("data-target-path")||f((c||"./")+n),window.nethelpRedirect=function(i,e){var s=/(([^?#]+\/)*[^\/?#]*)(\?[^#]*)?(?:#.*)?$/.exec(f(n+(i||"default.htm"))),h=e?e:"#!";s&&(i=s[1],n=s[2]||"",t=t.indexOf(n)===0?t.substring(n.length):t,s[3]&&s[3].length>1&&(r=s[3]+(r.length>1?"&"+r.substring(1):"")),i=i+(r.length>1?r:"")+h+t+(o.length>1?o:""),/\Wnhr=debug(\W|$)/i.test(u.href)?window.console?console.log(i):alert(i):u.replace(i))},e.write('<script type="text/javascript" src="'+n+'nethelppage.js"><\/script>')}})()