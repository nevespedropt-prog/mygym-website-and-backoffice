document.addEventListener("click",function(e){var b=e.target.closest(".burger"),h=document.querySelector("header");if(b){h.classList.toggle("open");return}if(h&&h.classList.contains("open")&&e.target.closest(".mnav a"))h.classList.remove("open")});(function(){var d=new Date(),g=d.getDay(),h=d.getHours()+d.getMinutes()/60,o=[5,24],e=document.getElementById("openNow");if(e)e.textContent=(h>=o[0]&&h<o[1])?"We're open now.":"Closed right now. See hours.";})();


(function(){
var w=document.getElementById("wiz");if(!w)return;
var CFG=window.MGL_FORMS||{};
var A={},cur=1,N=5,time=null,terms=false,news=false,t0=Date.now();
var GOAL={"Lose body fat":"Lose weight","Build strength & muscle":"Build strength","General fitness & energy":"Get fitter","Mobility & longevity":"Get fitter","Confidence with exercise":"Get fitter","Sport-specific training":"Train for an event"};
var LEVEL={"Brand new":"New to it","Getting back into it":"Some experience","Regular trainer":"Experienced"};
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function show(n){cur=n;[].forEach.call(w.querySelectorAll(".step"),function(s){s.classList.toggle("on",+s.dataset.s===n)});
 $("wbarI").style.width=(n*20)+"%";$("wstep").textContent="Step "+n+" of "+N;
 $("wback").style.visibility=n>1?"visible":"hidden";
 if(n===5)$("wsum").textContent=(A.goal||"")+" · "+(A.level||"")+" · "+(A.freq||"")+" · "+(A.style||"")}
w.addEventListener("submit",function(e){e.preventDefault()});
w.addEventListener("click",function(e){
 var c=e.target.closest(".qc");
 if(c){var g=c.parentNode;[].forEach.call(g.querySelectorAll(".qc"),function(x){x.classList.remove("on")});c.classList.add("on");A[g.dataset.g]=c.dataset.v;setTimeout(function(){show(Math.min(cur+1,N))},260);return}
 var o=e.target.closest("#wtime .opt");if(o){[].forEach.call(w.querySelectorAll("#wtime .opt"),function(x){x.classList.remove("on")});o.classList.add("on");time=o.dataset.v;$("wmsg").textContent="";return}
 if(e.target.closest("#wterms")){terms=!terms;$("wterms").classList.toggle("on",terms);$("wmsg").textContent="";return}
 if(e.target.closest("#wnews")){news=!news;$("wnews").classList.toggle("on",news);return}
 if(e.target.closest("#wback")){show(Math.max(cur-1,1));return}
 if(e.target.closest("#wbook")){
  var m=$("wmsg"),name=($("wname").value||"").trim(),phone=($("wphone").value||"").trim(),em=($("wemail").value||"").trim(),note=($("wnote").value||"").trim();
  if(!time){m.textContent="Please choose AM or PM.";return}
  if(name.length<2){m.textContent="Please enter your name.";$("wname").focus();return}
  if(!/^[0-9 +()\-]{7,25}$/.test(phone)){m.textContent="Please enter a phone number we can reach you on.";$("wphone").focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){m.textContent="Please enter a valid email so we can confirm your session.";$("wemail").focus();return}
  if(!terms){m.textContent="Please agree to the terms & conditions.";return}
  if(!CFG.endpoint){m.textContent="Sorry, the form is not available right now. Please email info@mygymlondon.co.uk.";return}
  var q=new URLSearchParams(location.search);
  var info=("Quiz: "+(A.goal||"")+" | "+(A.level||"")+" | "+(A.freq||"")+" | "+(A.style||"")+" | prefers "+time+(note?" | Note: "+note:"")).slice(0,600);
  var body={form_id:"pt-enquiry",elapsed:Math.round((Date.now()-t0)/1000),hp:($("whp").value||""),
   data:{full_name:name,email:em,phone:phone,goal:GOAL[A.goal]||"Something else",experience:LEVEL[A.level]||"Some experience",times:[time==="AM"?"Mornings":"Evenings"],health_note:info,
    page_url:location.href.split("#")[0],utm_source:q.get("utm_source")||"",utm_medium:q.get("utm_medium")||"",utm_campaign:q.get("utm_campaign")||""},
   consent:news?{marketing:true}:{}};
  var btn=$("wbook");btn.disabled=true;m.textContent="Sending...";
  fetch(CFG.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
   .then(function(r){return r.json().then(function(j){return{ok:r.ok&&j.ok,j:j}})})
   .then(function(res){
    if(!res.ok){m.textContent=(res.j.errors&&res.j.errors[0]&&res.j.errors[0].message)||res.j.error||"Sorry, that did not go through. Please try again or email info@mygymlondon.co.uk.";btn.disabled=false;return}
    var rec=A.style==="With friends"?["Small Group Personal Training","£60 a month · £15 each per session · minimum 4 sessions"]:A.style==="One to one"?["1-2-1 Personal Training","from £32.50 a session"]:["Your free session first","we'll find your best fit together"];
    var r=$("wres");
    r.innerHTML="<div class=\"ok\">✓</div><h3>Thanks, we have your request</h3><p>A coach will contact you within one working day to confirm your free <b>"+time+" PT session</b>. We have emailed a copy to <b>"+esc(em)+"</b>.</p><div class=\"rec\"><span>We'd suggest</span><h4>"+rec[0]+"</h4><small>"+rec[1]+"</small></div><p class=\"fine\">Goal: "+esc(A.goal||"")+" · "+esc(A.level||"")+" · "+esc(A.freq||"")+"</p>";
    [].forEach.call(w.querySelectorAll(".step,.wprog,.wtop"),function(x){x.style.display="none"});r.classList.add("on")})
   .catch(function(){m.textContent="No connection. Please check your internet and try again.";btn.disabled=false});
  return}});
})();


(function(){
var URL="https://ldmksxyilykyfnqnuytv.supabase.co",KEY="sb_publishable_gboSvVSFxQT0xDSEzbeYxw_E1OO3TRp",APP="https://app.mygymlondon.co.uk";
var days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],short=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
var F=[["all","All classes"],["cardio","HIIT & cardio"],["strength","Strength"],["mind","Pilates"],["fifty","50+"],["kids","Kids"]];
var rows=[],sel=(new Date().getDay()+6)%7,flt="all";
function $(i){return document.getElementById(i)}
function cat(n){n=n.toLowerCase();if(/kids/.test(n))return"kids";if(/50\+|vitality/.test(n))return"fifty";if(/pilates|yoga/.test(n))return"mind";if(/cardio|hiit|box/.test(n))return"cardio";if(/strength|abs|body/.test(n))return"strength";return"all"}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function paint(){
 var h="";days.forEach(function(d,i){h+='<button type="button" class="dt'+(i===sel?" sel":"")+'" data-d="'+i+'"><small>'+short[i]+'</small><b>'+short[i]+'</b></button>'});$("sdates").innerHTML=h;
 h="";F.forEach(function(f){h+='<button type="button" class="fc'+(f[0]===flt?" on":"")+'" data-f="'+f[0]+'">'+f[1]+'</button>'});$("sfilter").innerHTML=h;
 var list=rows.filter(function(r){return r.day_name===days[sel]&&(flt==="all"||cat(r.name)===flt)}).sort(function(a,b){return a.start_time<b.start_time?-1:1});
 h="";list.forEach(function(r){h+='<div class="slot"><span class="tm">'+esc(String(r.start_time).slice(0,5))+'</span><div><b>'+esc(r.name)+'</b><small>'+esc(r.info||"")+(r.coach?" · "+esc(r.coach):"")+(r.capacity?" · "+r.capacity+" places":"")+'</small></div><a class="btn sm" href="'+APP+'/#timetable">Book in the app</a></div>'});
 if(!list.length)h='<p class="note">No matching classes this day. Try another day or filter.</p>';
 $("sslots").innerHTML=h}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t||!$("sdates"))return;if(t.dataset.d){sel=+t.dataset.d;paint();return}if(t.dataset.f){flt=t.dataset.f;paint()}});
document.addEventListener("click",function(e){var a=e.target.closest("[data-cf]");if(!a||!$("sfilter"))return;e.preventDefault();flt=a.dataset.cf;paint();$("timetable").scrollIntoView({behavior:"smooth",block:"start"})});
if(!$("sdates"))return;
fetch(URL+"/rest/v1/classes?select=day_name,start_time,name,coach,info,capacity&active=eq.true&kind=eq.class&order=sort",{headers:{apikey:KEY,Authorization:"Bearer "+KEY}})
 .then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){rows=d;$("ttsub").textContent="The same timetable as the MyGym app. Book your place in the app.";paint()})
 .catch(function(){$("ttsub").innerHTML='We could not load the timetable. <a href="'+APP+'/#timetable">Open it in the app</a>.';paint()});
})();

// Booking form: free class, free gym session, or a question (3 steps). Sends to the submit-form back end.
(function(){
var root=document.getElementById("bk");
if(!root)return;
var T0=Date.now();
var SUPA="https://ldmksxyilykyfnqnuytv.supabase.co",KEY="sb_publishable_gboSvVSFxQT0xDSEzbeYxw_E1OO3TRp";
var ENDPOINT=SUPA+"/functions/v1/submit-form";
var NOTT="We could not load the timetable. Please call 07459 020381, or send us a question.";
var FALLBACK="Sorry, that did not go through. Please call 07459 020381 or email info@mygymlondon.co.uk.";
var LONG=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var TOPICS=["Memberships and prices","Classes and timetable","Personal training","Kids Gym","Something else"];
var PARTS=["Morning (5am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–midnight)"];
var SEND={cls:"Request free class",gym:"Request free gym session",ask:"Send question"};
var TITLE={cls:"Choose your class",gym:"Choose a day and time of day",ask:"Your question"};

function londonToday(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function londonMinutes(){var p=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date()).split(":");return +p[0]*60+ +p[1]}
function addDays(iso,n){var d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function wd(iso){return new Date(iso+"T12:00:00Z").getUTCDay()}
function nice(iso){return DAYS[wd(iso)]+" "+(+iso.slice(8))+" "+MON[+iso.slice(5,7)-1]}
var TODAY=londonToday();
var rows=null,rowsErr=false,rowsBusy=false,waiting=[];
function flush(){var w=waiting;waiting=[];w.forEach(function(f){f()})}
function loadRows(cb){
  if(rows){cb();return}
  waiting.push(cb);
  if(rowsBusy)return;
  rowsBusy=true;
  fetch(SUPA+"/rest/v1/classes?select=day_name,start_time,name,info&active=eq.true&kind=eq.class&order=sort",{headers:{apikey:KEY,Authorization:"Bearer "+KEY}})
  .then(function(r){if(!r.ok)throw 0;return r.json()})
  .then(function(d){rows=d;rowsBusy=false;flush()})
  .catch(function(){rowsErr=true;rowsBusy=false;flush()});
}

function add(e,c){if(c==null||c===false)return;if(Array.isArray(c))c.forEach(function(x){add(e,x)});else e.appendChild(c.nodeType?c:document.createTextNode(c))}
function h(t,a){var e=document.createElement(t);if(a)for(var k in a){var v=a[k];if(k==="class")e.className=v;else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),v);else if(v===true)e.setAttribute(k,"");else if(v!==false&&v!=null)e.setAttribute(k,v)}for(var i=2;i<arguments.length;i++)add(e,arguments[i]);return e}

var st={kind:null,step:1,day:0,pick:null,v:{topic:TOPICS[0]},busy:false,err:""};
var okEmail=function(s){return /^\S+@\S+\.\S+$/.test(s||"")};
function askReady(){return !!(st.v.msg&&st.v.msg.trim())}
function detailsReady(){var v=st.v;if(!v.name||!v.name.trim()||!okEmail(v.email))return false;if(st.kind==="ask")return true;return !!(v.phone&&v.phone.trim()&&v.health)}

var card=h("form",{class:"bk-card",novalidate:true,onsubmit:function(e){e.preventDefault();if(st.step===3&&!st.busy&&detailsReady())send()}});
var hp=h("input",{type:"text",name:"website",tabindex:"-1",autocomplete:"off","aria-hidden":"true",class:"bk-hp"});
var body=h("div",{class:"bk-body"});
card.appendChild(hp);card.appendChild(body);root.appendChild(card);

function go(step,focus){st.step=step;st.err="";render(focus)}
function head(){
  return h("div",{class:"bk-head"},
    h("div",{class:"bk-nav"},
      st.step>1?h("button",{type:"button",class:"bk-back",onclick:function(){go(st.step-1,true)}},"← Back"):h("span"),
      h("span",{class:"bk-step"},"Step "+st.step+" of 3")),
    h("div",{class:"bk-bar"},h("i",{style:"width:"+Math.round(st.step/3*100)+"%"})));
}
function tile(kind,title,sub){
  return h("button",{type:"button",class:"bk-tile",onclick:function(){st.kind=kind;st.day=0;st.pick=null;go(2,true)}},
    h("span",{},h("b",{},title),h("small",{},sub)),h("i",{"aria-hidden":"true"},"→"));
}
function field(key,label,type,ph,ac){
  var id="bk_"+key;
  return h("div",{class:"bk-fld"},h("label",{for:id},label),
    h("input",{id:id,type:type,placeholder:ph,autocomplete:ac,value:st.v[key]||"",oninput:function(e){st.v[key]=e.target.value;if(st.sync)st.sync()}}));
}
function chooser(){
  var strip=h("div",{class:"bk-strip",role:"group","aria-label":"Choose a day"}),list=h("div",{class:"bk-list"}),wrap=h("div",{},strip,list);
  var start=st.kind==="gym"?1:0,days=[],i;
  for(i=0;i<7;i++)days.push(addDays(TODAY,start+i));
  var chips=days.map(function(iso,i){
    return h("button",{type:"button",class:"bk-chip","aria-pressed":String(i===st.day),onclick:function(){
      st.day=i;st.pick=null;chips.forEach(function(c,j){c.setAttribute("aria-pressed",String(j===i))});fill();if(st.sync)st.sync()}},
      h("span",{class:"bk-dw"},(st.kind==="cls"&&i===0)?"Today":DAYS[wd(iso)]),h("span",{class:"bk-dn"},String(+iso.slice(8))));
  });
  chips.forEach(function(c){strip.appendChild(c)});
  function choose(btn,pick){
    st.pick=pick;
    Array.prototype.forEach.call(list.children,function(x){x.setAttribute("aria-pressed","false")});
    btn.setAttribute("aria-pressed","true");if(st.sync)st.sync();
  }
  function fill(){
    list.innerHTML="";
    var iso=days[st.day];
    if(st.kind==="cls"){
      if(!rows){
        list.appendChild(h("p",{class:"bk-none"},rowsErr?NOTT:"Loading the timetable…"));
        if(!rowsErr)loadRows(fill);
        return;
      }
      var slots=rows.filter(function(r){return r.day_name===LONG[wd(iso)]}).sort(function(a,b){return a.start_time<b.start_time?-1:1});
      if(!slots.length)list.appendChild(h("p",{class:"bk-none"},"No classes on this day."));
      slots.forEach(function(s){
        var t=String(s.start_time).slice(0,5),mins=+t.slice(0,2)*60+ +t.slice(3,5),dur=s.info||"";
        var gone=st.day===0&&mins<=londonMinutes();
        var b=h("button",{type:"button",class:"bk-row",disabled:gone,"aria-pressed":"false"},
          h("span",{class:"bk-t"},t),h("span",{class:"bk-n"},s.name),h("span",{class:"bk-d"},dur));
        b.addEventListener("click",function(){choose(b,{label:s.name+" · "+nice(iso)+" at "+t,name:s.name,date:nice(iso),time:t,dur:dur})});
        list.appendChild(b);
      });
    }else{
      PARTS.forEach(function(p){
        var b=h("button",{type:"button",class:"bk-row bk-part","aria-pressed":"false"},h("span",{class:"bk-n"},p));
        b.addEventListener("click",function(){choose(b,{label:"Gym session · "+nice(iso)+", "+p.split(" (")[0].toLowerCase(),iso:iso,part:p})});
        list.appendChild(b);
      });
    }
  }
  fill();
  return wrap;
}
function askFields(){
  var sel=h("select",{id:"bk_topic",onchange:function(e){st.v.topic=e.target.value}},TOPICS.map(function(t){return h("option",{value:t,selected:st.v.topic===t},t)}));
  return h("div",{},
    h("div",{class:"bk-fld"},h("label",{for:"bk_topic"},"Topic"),sel),
    h("div",{class:"bk-fld"},h("label",{for:"bk_msg"},"Your message"),
      h("textarea",{id:"bk_msg",rows:"4",placeholder:"How can we help?",oninput:function(e){st.v.msg=e.target.value;if(st.sync)st.sync()}},st.v.msg||"")));
}
function details(){
  var ask=st.kind==="ask";
  var box=h("div",{},
    h("div",{class:"bk-fields"},field("name","Full name","text","Your name","name"),field("email","Email","email","you@example.com","email"),ask?null:field("phone","Phone","tel","07700 000000","tel")));
  if(!ask)box.appendChild(h("label",{class:"bk-chk"},
    h("input",{type:"checkbox",id:"bk_health",checked:!!st.v.health,onchange:function(e){st.v.health=e.target.checked;if(st.sync)st.sync()}}),
    h("span",{},"I am fit to exercise, or I will tell the coach before the session about anything that might affect me. A short health questionnaire (PAR-Q) will follow by email.")));
  box.appendChild(h("p",{class:"bk-priv"},"We use your details only to reply to you. See our ",h("a",{href:"https://www.mygymlondon.co.uk/privacy",target:"_blank",rel:"noopener"},"privacy notice"),"."));
  return box;
}
function render(focus){
  body.innerHTML="";st.sync=null;
  var title,main,foot;
  if(st.step===1){
    title="What would you like to do?";
    main=h("div",{class:"bk-tiles"},
      tile("cls","Try a free class","Pick a class from this week’s timetable"),
      tile("gym","Book a free gym session","Choose a day and a time of day"),
      tile("ask","Ask a question","Prices, memberships, anything else"));
  }else if(st.step===2){
    title=TITLE[st.kind];
    main=st.kind==="ask"?askFields():chooser();
    var next=h("button",{type:"button",class:"btn",onclick:function(){go(3,true)}},"Continue");
    st.sync=function(){next.disabled=st.kind==="ask"?!askReady():!st.pick};st.sync();
    foot=h("div",{class:"bk-foot"},h("span"),next);
  }else{
    title="Your details";
    main=details();
    var sum=h("span",{class:"bk-sum"}),go2=h("button",{type:"submit",class:"btn"},SEND[st.kind]);
    var err=h("p",{class:"bk-err",role:"alert",hidden:!st.err},st.err);
    st.sync=function(){go2.disabled=st.busy||!detailsReady();go2.textContent=st.busy?"Sending…":SEND[st.kind];sum.textContent=st.kind==="ask"?"Topic: "+st.v.topic:st.pick.label};st.sync();
    foot=h("div",{},err,h("div",{class:"bk-foot"},sum,go2));
  }
  var hd=h("h3",{tabindex:"-1"},title);
  body.appendChild(head());body.appendChild(hd);body.appendChild(main);if(foot)body.appendChild(foot);
  if(focus)hd.focus({preventScroll:true});
}
function done(msg){
  body.innerHTML="";
  var again=h("button",{type:"button",class:"btn",onclick:function(){st={kind:null,step:1,day:0,pick:null,v:{topic:TOPICS[0]},busy:false,err:""};render(true)}},"Make another request");
  var hd=h("h3",{tabindex:"-1",class:"bk-ok"},"Request sent");
  body.appendChild(h("div",{class:"bk-done"},hd,h("p",{},msg||"Thank you. We will be in touch within one working day."),again));
  hd.focus({preventScroll:true});
}
function send(){
  var v=st.v,form,data,consent={};
  var page=location.origin+location.pathname;
  if(st.kind==="cls"){
    form="free-class";consent={health_ready:true};
    data={full_name:v.name.trim(),email:v.email.trim(),phone:v.phone.trim(),class_name:st.pick.name,class_date:st.pick.date,class_time:st.pick.time,class_duration:st.pick.dur,page_url:page};
  }else if(st.kind==="gym"){
    form="trial-gym";consent={health_ready:true};
    data={full_name:v.name.trim(),email:v.email.trim(),phone:v.phone.trim(),preferred_date:st.pick.iso,preferred_time:st.pick.part,page_url:page};
  }else{
    form="contact";
    data={full_name:v.name.trim(),email:v.email.trim(),topic:v.topic,message:v.msg.trim(),page_url:page};
  }
  st.busy=true;st.err="";if(st.sync)st.sync();
  var fail=function(j){
    st.busy=false;
    st.err=j&&j.errors&&j.errors[0]&&j.errors[0].message?j.errors[0].message:(j&&j.error)||FALLBACK;
    render(false);
  };
  fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({form_id:form,data:data,consent:consent,hp:hp.value,elapsed:Math.round((Date.now()-T0)/1000)})})
  .then(function(r){return r.json().then(function(j){return {ok:r.ok&&j.ok!==false,j:j}},function(){return {ok:false,j:null}})})
  .then(function(x){if(x.ok){st.busy=false;done(x.j.message)}else fail(x.j)})
  .catch(function(){fail(null)});
}
function preset(kind){
  if(st.busy||!/^(cls|gym|ask)$/.test(kind||""))return;
  if(st.kind===kind&&st.step>=2)return;
  st.kind=kind;st.day=0;st.pick=null;st.err="";st.step=2;render(false);
}
render(false);
var want=(location.search.match(/[?&]free=(cls|gym|ask)/)||[])[1];
if(want){preset(want);setTimeout(function(){root.scrollIntoView({block:"start"})},500)}
document.addEventListener("click",function(e){
  var g=e.target.closest('[data-go="free-class"]');if(!g)return;
  var t=document.getElementById("free-class");if(!t)return;
  preset(g.getAttribute("data-kind"));
  e.preventDefault();e.stopPropagation();
  var go=function(){t.scrollIntoView({behavior:"smooth",block:"start"})};
  if(!t.offsetParent){location.hash="#home";setTimeout(go,120)}else go();
},true);
})();
document.addEventListener("click",function(e){var g=e.target.closest("[data-go]");if(g){var t=document.getElementById(g.dataset.go);if(t)t.scrollIntoView({behavior:"smooth",block:"center"})}});
