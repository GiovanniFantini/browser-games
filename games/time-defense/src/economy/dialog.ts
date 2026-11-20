export interface Confirmation {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly content?: HTMLElement;
  readonly contentFirst?: boolean;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly cancelAction?: string;
  readonly audio?: "result";
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
  readonly additionalActions?: readonly { readonly label:string;readonly name:string;readonly run:()=>void }[];
  readonly restoreFocus: () => void;
}
let dialogSerial=0;
let audioOpen:(result:boolean)=>void=()=>{},audioClose:()=>void=()=>{};
export function setDialogAudioHooks(open:(result:boolean)=>void,close:()=>void):void{audioOpen=open;audioClose=close;}
export function createEconomyDialog(onOpen:()=>void=()=>{}) {
  const suffix=++dialogSerial===1?"":"-"+dialogSerial;
  const dialog=document.createElement("dialog");dialog.className="economy-dialog";
  dialog.setAttribute("aria-labelledby","economy-dialog-title");dialog.setAttribute("aria-describedby","economy-dialog-body");
  dialog.innerHTML=`<h2 id="economy-dialog-title"></h2><div id="economy-dialog-body"></div><div class="economy-dialog-actions"><button type="button" id="economy-dialog-cancel">Annulla</button><button type="button" id="economy-dialog-confirm">Conferma</button></div>`;
  for(const node of dialog.querySelectorAll<HTMLElement>("[id]"))node.id+=suffix;
  dialog.setAttribute("aria-labelledby","economy-dialog-title"+suffix);dialog.setAttribute("aria-describedby","economy-dialog-body"+suffix);
  document.body.append(dialog);
  const title=dialog.querySelector<HTMLElement>("h2")!,body=dialog.querySelector<HTMLElement>("#economy-dialog-body"+suffix)!,
    cancel=dialog.querySelector<HTMLButtonElement>("#economy-dialog-cancel"+suffix)!,confirm=dialog.querySelector<HTMLButtonElement>("#economy-dialog-confirm"+suffix)!;
  const scrollHint=document.createElement("p");scrollHint.className="economy-dialog-scroll-hint";scrollHint.textContent="Scorri il testo per continuare a leggere.";scrollHint.hidden=true;body.after(scrollHint);
  const updateScrollHint=()=>{scrollHint.hidden=body.scrollHeight<=body.clientHeight+1||body.scrollTop+body.clientHeight>=body.scrollHeight-2;};
  body.addEventListener("scroll",updateScrollHint);new ResizeObserver(updateScrollHint).observe(body);
  body.className="economy-dialog-body";body.tabIndex=0;body.setAttribute("aria-label","Condizioni dell’operazione, area scorrevole");
  let current: Confirmation|null=null;
  function finish(accepted: boolean): void {
    const request=current;if(!request)return;
    current=null;dialog.close();audioClose();
    if(accepted)request.onConfirm?.();else request.onCancel?.();
    request.restoreFocus();
  }
  cancel.addEventListener("click",()=>finish(false));
  confirm.addEventListener("click",event=>{if(event.detail<=1)finish(true);});
  dialog.addEventListener("cancel",event=>{event.preventDefault();finish(false);});
  dialog.addEventListener("keydown",event=>{
    if(event.key!=="Tab")return;
    const controls=[...dialog.querySelectorAll<HTMLElement>('button,a[href],input,select,summary,[tabindex="0"]')].filter(element=>
      !element.hidden&&!("disabled" in element&&element.disabled)&&element.getClientRects().length>0);
    const first=controls[0],last=controls.at(-1);
    if(!first||!last)return;
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  return {
    isOpen:()=>dialog.open,
    open(request: Confirmation): boolean {
      if(dialog.open)return false;
      onOpen();audioOpen(request.audio==="result");
      current=request;body.setAttribute("aria-label",request.title+", area scorrevole");title.textContent=request.title;body.replaceChildren();
      if(request.contentFirst&&request.content)body.append(request.content);
      for(const text of request.paragraphs){const p=document.createElement("p");p.textContent=text;body.append(p);}
      if(!request.contentFirst&&request.content)body.append(request.content);
      confirm.hidden=!request.confirmText;confirm.textContent=request.confirmText ?? "Conferma";
      if(request.cancelAction)cancel.dataset.action=request.cancelAction;else delete cancel.dataset.action;
      cancel.textContent=request.cancelText??(request.confirmText ? "Annulla" : "Chiudi");
      for(const button of dialog.querySelectorAll(".economy-dialog-extra"))button.remove();
      for(const action of request.additionalActions??[]){
        const button=document.createElement("button");button.type="button";button.className="economy-dialog-extra";button.textContent=action.label;button.dataset.action=action.name;
        button.addEventListener("click",event=>{if(event.detail>1||current!==request)return;current=null;dialog.close();audioClose();action.run();request.restoreFocus();});
        confirm.parentElement!.append(button);
      }
      dialog.showModal();body.scrollTop=0;updateScrollHint();cancel.focus();return true;
    },
    cancel:()=>finish(false),
  };
}

