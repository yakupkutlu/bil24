import { PropsWithChildren } from 'react';
export function Drawer({open,children}:PropsWithChildren<{open:boolean}>){return <aside className={`fixed inset-y-0 right-0 z-40 w-80 border-l border-white/10 bg-theater-black p-5 shadow-xl transition ${open?'translate-x-0':'translate-x-full'}`}>{children}</aside>}
