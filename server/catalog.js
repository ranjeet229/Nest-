export const products = [
 ['sony-headphones','Sony WH-1000XM5','Wireless noise-cancelling headphones','Electronics',24990,34990,'photo-1546435770-a3e426bf472b',4.9,1284,'BESTSELLER'],
 ['everyday-sneakers','The Everyday Sneaker','A little comfort. A lot of style.','Fashion',3499,5999,'photo-1542291026-7eec264c27ff',4.8,862,'30% OFF'],
 ['ceramic-vase','Nordic Ceramic Vase','Sculptural, simple, naturally beautiful','Home & Living',1299,1999,'photo-1578500494198-246f612d3b3d',4.7,346,''],
 ['apple-watch','Apple Watch Series 9','Your everyday, upgraded','Electronics',32900,41900,'photo-1546868871-7041f2a55e12',4.9,2156,'TRENDING'],
 ['weekend-bag','The Weekender Tote','Everything you need. Ready to go.','Fashion',1899,2999,'photo-1553062407-98eeb64c6a62',4.8,529,''],
 ['skincare','Daily Glow Essentials','A little ritual for radiant skin','Beauty',1499,2199,'photo-1608571423902-eed4a5ad8108',4.6,421,'NEW'],
 ['chair','Oslo Lounge Chair','Your new favourite corner','Home & Living',8999,12999,'photo-1567538096630-e0c55bd6374c',4.8,192,''],
 ['camera','Fujifilm Instax Mini','Make memories you can hold','Electronics',7499,9999,'photo-1516035069371-29a1b244cc32',4.7,673,''],
 ['yoga','Everyday Yoga Mat','Find your balance','Sports',1299,1899,'photo-1601925260368-ae2f83cf8b7f',4.7,203,''],
 ['book','The Creative Collection','Make room for a new perspective','Books',699,999,'photo-1544947950-fa07a98d237f',4.8,312,'']
].map(([slug,name,description,category,price,original,image,rating,reviews,badge])=>({slug,name,description,category,price,original,image:`https://images.unsplash.com/${image}?auto=format&fit=crop&w=700&q=85`,rating,reviews,badge,stock:100}));
