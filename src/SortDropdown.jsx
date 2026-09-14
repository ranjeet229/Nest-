import {useEffect,useId,useRef,useState} from 'react';
import {Check,ChevronDown,SlidersHorizontal} from 'lucide-react';

const options=[['featured','Featured'],['low','Price: low to high'],['high','Price: high to low'],['rating','Top rated']];

export default function SortDropdown({value,onChange}){
  const [open,setOpen]=useState(false);
  const root=useRef(null),trigger=useRef(null),items=useRef([]);
  const id=useId();
  const selected=options.findIndex(([key])=>key===value);
  useEffect(()=>{
    if(!open)return;
    items.current[selected]?.focus();
    const outside=e=>{if(!root.current?.contains(e.target))setOpen(false)};
    document.addEventListener('pointerdown',outside);
    return()=>document.removeEventListener('pointerdown',outside);
  },[open,selected]);
  function choose(key){onChange(key);setOpen(false);trigger.current?.focus()}
  function navigate(e){
    const index=items.current.indexOf(document.activeElement);
    let next;
    if(e.key==='ArrowDown')next=(index+1)%options.length;
    if(e.key==='ArrowUp')next=(index-1+options.length)%options.length;
    if(e.key==='Home')next=0;
    if(e.key==='End')next=options.length-1;
    if(next!==undefined){e.preventDefault();items.current[next]?.focus()}
    if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus()}
  }
  return <div className="sort-dropdown" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
    <button type="button" className={'sort-trigger'+(open?' is-open':'')} ref={trigger} aria-label={`Sort products: ${options[selected][1]}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(!open)} onKeyDown={e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();setOpen(true)}}}>
      <SlidersHorizontal size={15}/><span>{options[selected][1]}</span><ChevronDown size={14} className="sort-chevron"/>
    </button>
    {open&&<div className="sort-menu" id={id} role="menu" aria-label="Sort products" onKeyDown={navigate}>
      <span className="sort-menu-heading">SORT BY</span>
      {options.map(([key,label],index)=><button type="button" key={key} ref={el=>{items.current[index]=el}} role="menuitemradio" aria-checked={value===key} tabIndex={-1} className={'sort-option'+(value===key?' is-selected':'')} onClick={()=>choose(key)}><span>{label}</span>{value===key&&<Check size={15}/>}</button>)}
    </div>}
  </div>;
}
