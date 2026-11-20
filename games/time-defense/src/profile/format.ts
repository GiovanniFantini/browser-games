import { starsForRatio } from "./model";
// Rounded labels must never imply a star threshold or perfect score not actually reached.
export function ratioText(ratio:number):string{
  const percent=Number((ratio*100).toFixed(2));
  if(ratio>0&&percent===0)return"<0,01%";
  const label=percent.toLocaleString("it-IT",{maximumFractionDigits:2})+"%";
  return starsForRatio(ratio)!==starsForRatio(percent/100)||ratio<1&&percent===100?"<"+label:label;
}
