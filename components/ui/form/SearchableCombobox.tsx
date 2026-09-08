'use client';
import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { useFieldControl } from './FieldContext';
export interface ComboboxItem { id: string; label: string; sublabel?: string; badge?: string; meta?: any; }
export interface SearchableComboboxProps {
 items: ComboboxItem[]; value: string; onChange: (value: string, item?: ComboboxItem) => void;
 placeholder?: string; searchPlaceholder?: string; error?: boolean; disabled?: boolean; emptyText?: string; clearable?: boolean;
}
export function SearchableCombobox({items,value,onChange,placeholder='Select an option',searchPlaceholder='Type to search',error,disabled,emptyText='No matching options found',clearable=true}: SearchableComboboxProps) {
 const [isOpen,setIsOpen]=useState(false), [query,setQuery]=useState(''), [active,setActive]=useState(0);
 const container=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null), search=useRef<HTMLInputElement>(null);
 const field=useFieldControl(), listId=useId();
 const selected=items.find(item=>item.id===value);
 const filtered=items.filter(item=>[item.label,item.sublabel,item.badge].some(text=>text?.toLowerCase().includes(query.toLowerCase().trim())));
 const close=()=>{setIsOpen(false);setQuery('');trigger.current?.focus();};
 const choose=(item:ComboboxItem)=>{onChange(item.id,item);close();};
 useEffect(()=>{const outside=(event:MouseEvent)=>{if(!container.current?.contains(event.target as Node)){setIsOpen(false);setQuery('');}};document.addEventListener('mousedown',outside);return()=>document.removeEventListener('mousedown',outside);},[]);
 useEffect(()=>{if(isOpen){setActive(0);search.current?.focus();}},[isOpen]);
 useEffect(()=>{if(isOpen) document.getElementById(listId+'-'+active)?.scrollIntoView({block:'nearest'});},[active,isOpen,listId]);
 const keyboard=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
  else if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(index+1,filtered.length-1));}
  else if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(index-1,0));}
  else if(event.key==='Enter' && filtered[active]){event.preventDefault();choose(filtered[active]);}
  else if(event.key==='Tab'){setIsOpen(false);setQuery('');}
 };
 return <div className="ocCombobox" ref={container}>
 <button {...field} role="combobox" ref={trigger} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={isOpen?listId:undefined} aria-invalid={error || field['aria-invalid']} className={`crmFormInput ocComboTrigger ${error?'hasError':''}`} onClick={()=>setIsOpen(!isOpen)} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setIsOpen(true);}}}>
 <span>{selected?.label || placeholder}</span><ChevronDown size={18} aria-hidden="true" />
 </button>
 {clearable && selected && !disabled && <button className="ocComboClear" type="button" aria-label={`Clear ${selected.label}`} onClick={()=>onChange('')}>Clear selection</button>}
 {isOpen && <div className="ocComboMenu"><div className="ocComboSearch"><Search size={16} aria-hidden="true" /><input ref={search} role="combobox" aria-label={searchPlaceholder} aria-expanded="true" aria-autocomplete="list" aria-controls={listId} aria-activedescendant={filtered[active]?listId+'-'+active:undefined} value={query} placeholder={searchPlaceholder} onChange={event=>{setQuery(event.target.value);setActive(0);}} onKeyDown={keyboard} /></div>
 <div className="ocComboList" role="listbox" id={listId} aria-label={placeholder}>
 {filtered.map((item,index)=><div key={item.id} id={listId+'-'+index} role="option" aria-selected={item.id===value} data-active={index===active} className="ocComboOption" onMouseEnter={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(item)}><div>{item.label}{item.sublabel && <small>{item.sublabel}</small>}</div>{item.badge && <span className="ocBadge">{item.badge}</span>}{item.id===value && <Check size={16} aria-hidden="true" />}</div>)}
 </div>{!filtered.length && <p role="status" style={{padding:16,color:'var(--oc-muted)'}}>{emptyText}</p>}</div>}
 </div>;
}
export default SearchableCombobox;
