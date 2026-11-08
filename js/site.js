/* Psusennes static site: header states, mobile menu, WhatsApp UTM tagging, scroll reveal,
   staggered cards and hero parallax (replaces Webflow IX3 + GSAP). Respects prefers-reduced-motion. */
(function(){
"use strict";
var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
function ready(f){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f()}
ready(function(){
 /* header: solid on scroll, dark links on pages without a photo hero, mobile menu */
 var h=document.querySelector('.site-header');
 if(h){
  if(!document.querySelector('.hero,.page-hero'))h.classList.add('on-light');
  var s=function(){h.classList.toggle('is-scrolled',(window.scrollY||0)>40)};s();addEventListener('scroll',s,{passive:true});
  var b=h.querySelector('.menu-btn');
  if(b)b.addEventListener('click',function(){var o=h.classList.toggle('is-open');b.setAttribute('aria-expanded',o?'true':'false');b.setAttribute('aria-label',o?'Close menu':'Open menu')});
  h.querySelectorAll('.mobile-nav a').forEach(function(a){a.addEventListener('click',function(){h.classList.remove('is-open')})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')h.classList.remove('is-open')});
 }
 /* logo fallback: gold text when the Cloudinary logo cannot load */
 document.querySelectorAll('.brand img').forEach(function(im){var f=function(){im.closest('.brand').classList.add('no-logo')};
  if(im.complete&&im.naturalWidth===0)f();else im.addEventListener('error',f)});
 /* WhatsApp: tag the message with the campaign source (utm_source) */
 try{var q=new URLSearchParams(location.search),src=q.get('utm_source')||sessionStorage.getItem('ps_src');
  if(src){sessionStorage.setItem('ps_src',src);document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href*="wa.me/"]');
   if(!a||a.dataset.tagged)return;var u=new URL(a.href);u.searchParams.set('text',(u.searchParams.get('text')||'')+' (via '+src+')');a.href=u.toString();a.dataset.tagged=1},true)}}catch(e){}
 /* footer year */
 document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear()});
 /* scroll reveal + staggered groups */
 var els=[].slice.call(document.querySelectorAll('.reveal,.stagger'));
 document.querySelectorAll('.stagger').forEach(function(g){[].slice.call(g.children).forEach(function(c,i){c.style.transitionDelay=Math.min(i,8)*80+'ms'})});
 if(reduced||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')})}
 else{var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  els.forEach(function(e){io.observe(e)});
  setTimeout(function(){els.forEach(function(e){var r=e.getBoundingClientRect();if(r.top<innerHeight)e.classList.add('in')})},1200)}
 /* hero parallax */
 var hm=document.querySelector('.hero-media');
 if(hm&&!reduced){var tk=false,p=function(){var y=window.scrollY||0;if(y<innerHeight*1.2)hm.style.transform='translate3d(0,'+(y*.25).toFixed(1)+'px,0)';tk=false};
  addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(p)}},{passive:true});p()}
});
})();
