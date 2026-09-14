export function totals(items){const subtotal=items.reduce((sum,i)=>sum+i.price*i.quantity,0);const shipping=subtotal>=1999?0:99;return {subtotal,shipping,total:subtotal+shipping};}
