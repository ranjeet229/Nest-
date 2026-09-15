const categoryCatalog = {
  'Electronics': { companies:['Sony','JBL','boAt','Samsung','Logitech'], items:['Wireless Headphones','Smart Watch','Bluetooth Speaker','Power Bank','Wireless Keyboard'], image:'photo-1546435770-a3e426bf472b' },
  Fashion: { companies:['Mango','H&M','Levi’s','Puma','Allen Solly'], items:['Everyday Sneakers','Cotton Shirt','Classic Tote','Relaxed Hoodie','Slim Fit Jeans'], image:'photo-1542291026-7eec264c27ff' },
  'Home & Living': { companies:['IKEA','Ellementry','Nestasia','Urban Ladder','Home Centre'], items:['Ceramic Vase','Table Lamp','Lounge Chair','Cotton Throw','Storage Basket'], image:'photo-1578500494198-246f612d3b3d' },
  Beauty: { companies:['Minimalist','Plum','Mamaearth','Dot & Key','The Ordinary'], items:['Glow Serum','Daily Sunscreen','Hydrating Cleanser','Lip Tint','Body Lotion'], image:'photo-1608571423902-eed4a5ad8108' },
  Sports: { companies:['Nike','Adidas','Decathlon','Puma','Yonex'], items:['Yoga Mat','Training Shoes','Steel Bottle','Gym Duffel','Cricket Bat'], image:'photo-1601925260368-ae2f83cf8b7f' },
  Books: { companies:['Penguin','HarperCollins','Bloomsbury','Rupa','Hachette'], items:['Contemporary Fiction','Mindful Living Guide','Business Classic','Illustrated Cookbook','Young Readers Novel'], image:'photo-1544947950-fa07a98d237f' }
};
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const imageUrl = image => `https://images.unsplash.com/${image}?auto=format&fit=crop&w=700&q=85`;
export const products = Object.entries(categoryCatalog).flatMap(([category, config]) => Array.from({length:1000}, (_, index) => {
  const number=index+1, company=config.companies[index%config.companies.length], item=config.items[index%config.items.length];
  const price=700+((index*137+category.length*91)%9301);
  return {slug:`${slugify(category)}-${slugify(company)}-${slugify(item)}-${number}`,name:`${company} ${item} ${number}`,company,description:`A thoughtfully chosen ${item.toLowerCase()} from ${company}.`,category,price,original:Math.min(10000,price+150+((index*43)%1800)),image:`https://loremflickr.com/700/700/${encodeURIComponent(category.toLowerCase())}?lock=${number}`,rating:Number((4.1+((index*7)%9)/10).toFixed(1)),reviews:20+((index*83)%5000),badge:index%29===0?'BESTSELLER':index%17===0?'NEW':index%11===0?'VALUE PICK':'',stock:100};
}));
