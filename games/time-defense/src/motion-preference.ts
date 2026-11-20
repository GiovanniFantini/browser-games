let reduced=false,forced=false;
if(typeof matchMedia==="function"){
  const preference=matchMedia("(prefers-reduced-motion: reduce)");reduced=preference.matches;
  preference.addEventListener("change",event=>{reduced=event.matches;});
}
export function prefersReducedMotion():boolean{return reduced||forced;}

export function setReducedMotionPreference(value:boolean):void{forced=value;}
