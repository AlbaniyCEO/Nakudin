const NAKUDIN_LOGO = "/brand/nakudin-logo-transparent.png";

function qrDataUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(text)}`;
}

function brandHeader(label: string) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid #e5e7eb;padding-bottom:12px">
    <img src="${NAKUDIN_LOGO}" style="width:170px;height:auto;object-fit:contain" />
    <div class="muted" style="text-align:right">${label}<br/>nakudin.com</div>
  </div>`;
}

function openPrintWindow(title: string, body: string) {
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Inter,system-ui,sans-serif;padding:24px;color:#111} h1,h2,h3{margin:0 0 8px} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px} .card{border:1px solid #ddd;border-radius:12px;padding:12px;break-inside:avoid} img{max-width:100%;border-radius:10px} .muted{color:#666;font-size:12px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px} .hero{display:flex;align-items:center;gap:16px;margin-bottom:20px}.logo{width:72px;height:72px;border-radius:16px;object-fit:cover;background:#f3f4f6}.page-break{page-break-before:always}
  </style></head><body>${body}<script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}

export function printCatalog(shop: any, products: any[]) {
  const body = `
    ${brandHeader('Customer Product Catalog')}
    <div class="hero">
      ${shop.logoUrl ? `<img class="logo" src="${shop.logoUrl}" />` : ''}
      <div><h1>${shop.businessName}</h1><div class="muted">Customer Product Catalog</div></div>
    </div>
    <div class="grid">
      ${products.filter(p => p.status === 'active').map(p => `<div class="card">
        ${p.images?.[0] ? `<img src="${p.images[0]}" />` : ''}
        <h3 style="margin-top:10px">${p.title}</h3>
        <div style="font-weight:700">₦${Number(p.price || 0).toLocaleString('en-NG')}</div>
      </div>`).join('')}
    </div>`;
  openPrintWindow(`${shop.businessName} Catalog`, body);
}

export function printStockReport(shop: any, products: any[]) {
  const rows = products.map(p => {
    const stock = p.stockQuantity ?? 0;
    const status = stock === 0 ? 'Out of Stock' : stock <= 3 ? 'Low Stock' : 'In Stock';
    return `<tr><td>${p.title}</td><td>₦${Number(p.price || 0).toLocaleString('en-NG')}</td><td>${stock}</td><td>${status}</td></tr>`;
  }).join('');
  openPrintWindow(`${shop.businessName} Stock Report`, `${brandHeader('Private Stock Report')}<h1>${shop.businessName}</h1><div class="muted">Private Stock Report</div><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`);
}

export function printMonthlySummary(shop: any, analytics: any, products: any[], monthLabel: string) {
  const top = [...products].sort((a,b)=>(b.viewCount+b.likeCount+b.whatsappClickCount)-(a.viewCount+a.likeCount+a.whatsappClickCount)).slice(0,5);
  const bars = top.map(p => `<div style="margin:8px 0"><div style="font-size:12px">${p.title}</div><div style="height:10px;background:#eee;border-radius:999px;overflow:hidden"><div style="width:${Math.min(100, (p.viewCount||0))}%;height:100%;background:#6D28D9"></div></div></div>`).join('');
  openPrintWindow(`${shop.businessName} Monthly Summary`, `
    ${brandHeader('Monthly Analytics Summary')}
    <h1>${shop.businessName}</h1>
    <div class="muted">Monthly Summary · ${monthLabel}</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0">
      <div class="card"><h3>Total Views</h3><div>${(analytics?.totalViews ?? 0).toLocaleString()}</div></div>
      <div class="card"><h3>Total Likes</h3><div>${(analytics?.totalLikes ?? 0).toLocaleString()}</div></div>
      <div class="card"><h3>WhatsApp Clicks</h3><div>${(analytics?.totalWhatsappClicks ?? 0).toLocaleString()}</div></div>
      <div class="card"><h3>New Followers</h3><div>${(analytics?.followerCount ?? 0).toLocaleString()}</div></div>
    </div>
    <div class="card"><h3>Top 5 Products</h3>${bars}</div>
  `);
}

export function printFlyer(shop: any) {
  const profileUrl = `${window.location.origin}${shop.customSlug ? `/s/${shop.customSlug}` : `/shops/${shop.id}`}`;
  const qr = qrDataUrl(profileUrl);
  openPrintWindow(`${shop.businessName} Flyer`, `
    <div class="card" style="padding:24px">
      <img src="${NAKUDIN_LOGO}" style="width:190px;height:auto;object-fit:contain;margin-bottom:18px" />
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div>
          ${shop.logoUrl ? `<img class="logo" src="${shop.logoUrl}" />` : ''}
          <h1 style="margin-top:12px">${shop.businessName}</h1>
          <div class="muted">${shop.category || ''}</div>
          <div style="margin-top:8px;font-size:14px">WhatsApp: ${shop.whatsappNumber || ''}</div>
          <div style="margin-top:8px;font-size:12px">${shop.verified ? 'Verified Shop' : ''}</div>
        </div>
        <div style="text-align:center">
          <img src="${qr}" style="width:180px;height:180px" />
          <div class="muted">Scan to open shop</div>
        </div>
      </div>
    </div>
  `);
}

export function printReceipt(shop: any, products: any[] = []) {
  const activeProducts = products.filter(p => p.status !== 'deleted');
  const today = new Date();
  const receiptNo = `NKD-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const rows = activeProducts.slice(0, 12).map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${p.title}</td>
      <td>₦${Number(p.price || 0).toLocaleString('en-NG')}</td>
      <td>${p.stockQuantity === 0 ? 'Out of Stock' : 'Available'}</td>
    </tr>
  `).join('');
  openPrintWindow(`${shop.businessName} Receipt`, `
    ${brandHeader('Shop Receipt')}
    <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:18px">
      <div>
        <h1>${shop.businessName}</h1>
        <div class="muted">${shop.category || ''}</div>
        <div class="muted">WhatsApp: ${shop.whatsappNumber || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">Receipt</div>
        <div class="muted">${receiptNo}</div>
        <div class="muted">${today.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <h3>Customer / Transaction Note</h3>
      <div style="height:54px;border:1px dashed #bbb;border-radius:10px;margin-top:8px"></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Product / Service</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">No products listed.</td></tr>'}</tbody>
    </table>
    <p class="muted" style="margin-top:18px">Generated from Nakudin dashboard. This receipt can be printed or saved as PDF and works offline once the dashboard is loaded.</p>
  `);
}
