import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

// 日本語フォントのサポート
import 'jspdf-autotable';

// 請求書テンプレート
const invoiceTemplates = {
  // 標準テンプレート
  standard: (invoice) => `
    <div class="invoice-preview" style="font-family: sans-serif; padding: 15px; max-width: 750px; margin: 0 auto;">
      <h1 style="text-align: center; margin-bottom: 15px; font-size: 20px;">請求書</h1>
      
      <div style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <div style="width: 60%;">
          <p style="margin: 3px 0;"><strong>請求書番号:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 3px 0;"><strong>発行日:</strong> ${invoice.issueDate}</p>
          <p style="margin: 3px 0;"><strong>支払期限:</strong> ${invoice.dueDate}</p>
        </div>
        <div style="width: 40%; text-align: right;">
          <p style="margin: 3px 0; font-size: 16px;"><strong>合計金額:</strong> ¥${invoice.total.toLocaleString()}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <div style="width: 45%; margin-right: 5%;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">請求元:</h3>
          <p style="margin: 3px 0; font-size: 12px;">${invoice.company.name}</p>
          <p style="margin: 3px 0; font-size: 12px;">〒${invoice.company.postalCode}</p>
          <p style="margin: 3px 0; font-size: 12px;">${invoice.company.address}</p>
          <p style="margin: 3px 0; font-size: 12px;">電話: ${invoice.company.phone}</p>
          <p style="margin: 3px 0; font-size: 12px;">メール: ${invoice.company.email}</p>
        </div>
        <div style="width: 45%;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">請求先:</h3>
          <p style="margin: 3px 0; font-size: 12px;">${invoice.client.name}</p>
          <p style="margin: 3px 0; font-size: 12px;">〒${invoice.client.postalCode}</p>
          <p style="margin: 3px 0; font-size: 12px;">${invoice.client.address}</p>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd; background-color: #f9f9f9;">
            <th style="text-align: left; padding: 5px; width: 45%;">品目</th>
            <th style="text-align: right; padding: 5px; width: 10%;">数量</th>
            <th style="text-align: right; padding: 5px; width: 15%;">単価</th>
            <th style="text-align: right; padding: 5px; width: 10%;">税率</th>
            <th style="text-align: right; padding: 5px; width: 20%;">金額</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 5px; font-size: 11px;">${item.description}</td>
              <td style="text-align: right; padding: 5px; font-size: 11px;">${item.quantity}</td>
              <td style="text-align: right; padding: 5px; font-size: 11px;">¥${parseFloat(item.unitPrice).toLocaleString()}</td>
              <td style="text-align: right; padding: 5px; font-size: 11px;">${item.taxRate}%</td>
              <td style="text-align: right; padding: 5px; font-size: 11px;">¥${parseFloat(item.amount).toLocaleString()}</td>
            </tr>
          `).join('')}
          ${Array(Math.max(0, 10 - invoice.items.length)).fill().map(() => `
            <tr style="border-bottom: 1px solid #eee; height: 25px;">
              <td style="padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="display: flex; justify-content: flex-end;">
        <table style="width: 250px; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 3px; font-weight: bold; text-align: left;">小計:</td>
            <td style="padding: 3px; text-align: right;">¥${invoice.subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 3px; font-weight: bold; text-align: left;">消費税:</td>
            <td style="padding: 3px; text-align: right;">¥${invoice.taxAmount.toLocaleString()}</td>
          </tr>
          <tr style="border-top: 1px solid #ddd;">
            <td style="padding: 3px; font-weight: bold; text-align: left; font-size: 14px;">合計金額:</td>
            <td style="padding: 3px; text-align: right; font-weight: bold; font-size: 14px;">¥${invoice.total.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-top: 15px; font-size: 12px;">
        <h3 style="margin: 0 0 5px 0; font-size: 14px;">振込先情報:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px; width: 20%;"><strong>銀行名:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.bankName}</td>
            <td style="padding: 3px; width: 20%;"><strong>支店名:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.branchName}</td>
          </tr>
          <tr>
            <td style="padding: 3px;"><strong>口座種類:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.accountType}</td>
            <td style="padding: 3px;"><strong>口座番号:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.accountNumber}</td>
          </tr>
          <tr>
            <td style="padding: 3px;"><strong>口座名義:</strong></td>
            <td style="padding: 3px;" colspan="3">${invoice.bankInfo.accountName}</td>
          </tr>
        </table>
      </div>
      
      ${invoice.notes ? `
        <div style="margin-top: 15px; font-size: 12px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">備考:</h3>
          <p style="margin: 0;">${invoice.notes}</p>
        </div>
      ` : ''}
    </div>
  `,
  
  // モダンテンプレート
  modern: (invoice) => `
    <div class="invoice-preview" style="font-family: 'Helvetica', sans-serif; padding: 20px; max-width: 750px; margin: 0 auto; color: #333; background-color: #f9f9f9;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #3498db;">
        <h1 style="font-size: 20px; color: #3498db; margin: 0;">請求書</h1>
        <div style="text-align: right;">
          <p style="margin: 2px 0; font-size: 12px;"><strong>請求書番号:</strong> #${invoice.invoiceNumber}</p>
          <p style="margin: 2px 0; font-size: 12px;"><strong>発行日:</strong> ${invoice.issueDate}</p>
          <p style="margin: 2px 0; font-size: 12px;"><strong>支払期限:</strong> ${invoice.dueDate}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <div style="width: 47%; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">請求元</h3>
          <p style="margin: 2px 0; font-size: 12px;"><strong>${invoice.company.name}</strong></p>
          <p style="margin: 2px 0; font-size: 12px;">〒${invoice.company.postalCode}</p>
          <p style="margin: 2px 0; font-size: 12px;">${invoice.company.address}</p>
          <p style="margin: 2px 0; font-size: 12px;">電話: ${invoice.company.phone}</p>
          <p style="margin: 2px 0; font-size: 12px;">メール: ${invoice.company.email}</p>
        </div>
        <div style="width: 47%; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">請求先</h3>
          <p style="margin: 2px 0; font-size: 12px;"><strong>${invoice.client.name}</strong></p>
          <p style="margin: 2px 0; font-size: 12px;">〒${invoice.client.postalCode}</p>
          <p style="margin: 2px 0; font-size: 12px;">${invoice.client.address}</p>
        </div>
      </div>
      
      <div style="background-color: white; padding: 10px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #3498db; color: white;">
              <th style="text-align: left; padding: 5px; border-radius: 3px 0 0 0; width: 45%;">品目</th>
              <th style="text-align: right; padding: 5px; width: 10%;">数量</th>
              <th style="text-align: right; padding: 5px; width: 15%;">単価</th>
              <th style="text-align: right; padding: 5px; width: 10%;">税率</th>
              <th style="text-align: right; padding: 5px; border-radius: 0 3px 0 0; width: 20%;">金額</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr style="border-bottom: ${index === invoice.items.length - 1 ? 'none' : '1px solid #eee'};">
                <td style="padding: 5px; font-size: 11px;">${item.description}</td>
                <td style="text-align: right; padding: 5px; font-size: 11px;">${item.quantity}</td>
                <td style="text-align: right; padding: 5px; font-size: 11px;">¥${parseFloat(item.unitPrice).toLocaleString()}</td>
                <td style="text-align: right; padding: 5px; font-size: 11px;">${item.taxRate}%</td>
                <td style="text-align: right; padding: 5px; font-size: 11px;">¥${parseFloat(item.amount).toLocaleString()}</td>
              </tr>
            `).join('')}
            ${Array(Math.max(0, 10 - invoice.items.length)).fill().map(() => `
              <tr style="border-bottom: 1px solid #eee; height: 22px;">
                <td style="padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 230px; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="margin: 0; font-size: 12px;"><strong>小計:</strong></p>
            <p style="margin: 0; font-size: 12px;">¥${invoice.subtotal.toLocaleString()}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid #eee;">
            <p style="margin: 0; font-size: 12px;"><strong>消費税:</strong></p>
            <p style="margin: 0; font-size: 12px;">¥${invoice.taxAmount.toLocaleString()}</p>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #3498db;">
            <p style="margin: 0; font-size: 14px;">合計金額:</p>
            <p style="margin: 0; font-size: 14px;">¥${invoice.total.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
        <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">振込先情報</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
          <p style="margin: 2px 0;"><strong>銀行名:</strong> ${invoice.bankInfo.bankName}</p>
          <p style="margin: 2px 0;"><strong>支店名:</strong> ${invoice.bankInfo.branchName}</p>
          <p style="margin: 2px 0;"><strong>口座種類:</strong> ${invoice.bankInfo.accountType}</p>
          <p style="margin: 2px 0;"><strong>口座番号:</strong> ${invoice.bankInfo.accountNumber}</p>
          <p style="margin: 2px 0; grid-column: span 2;"><strong>口座名義:</strong> ${invoice.bankInfo.accountName}</p>
        </div>
      </div>
      
      ${invoice.notes ? `
        <div style="margin-top: 15px; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">備考</h3>
          <p style="margin: 0; font-size: 12px;">${invoice.notes}</p>
        </div>
      ` : ''}
    </div>
  `
};

function App() {
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    company: {
      name: '',
      address: '',
      postalCode: '',
      phone: '',
      email: ''
    },
    client: {
      name: '',
      address: '',
      postalCode: ''
    },
    bankInfo: {
      bankName: '',
      branchName: '',
      accountType: '',
      accountNumber: '',
      accountName: ''
    },
    items: [
      { description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 10 }
    ],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    notes: '振込手数料はご負担願います。',
    sendToEmail: '',
    template: 'standard'
  });

  const invoiceRef = useRef(null);

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      company: {
        ...invoice.company,
        [name]: value
      }
    });
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      client: {
        ...invoice.client,
        [name]: value
      }
    });
  };

  const handleBankInfoChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      bankInfo: {
        ...invoice.bankInfo,
        [name]: value
      }
    });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...invoice.items];
    
    items[index] = {
      ...items[index],
      [name]: value
    };
    
    // 金額の自動計算
    if (name === 'quantity' || name === 'unitPrice' || name === 'taxRate') {
      const quantity = parseFloat(items[index].quantity) || 0;
      const unitPrice = parseFloat(items[index].unitPrice) || 0;
      items[index].amount = quantity * unitPrice;
    }
    
    // 小計、消費税、合計金額の計算
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 各品目ごとの消費税を計算
    const taxAmount = items.reduce((sum, item) => {
      const itemTaxRate = parseFloat(item.taxRate) || 0;
      const itemAmount = parseFloat(item.amount) || 0;
      return sum + Math.round(itemAmount * (itemTaxRate / 100) * 10) / 10;
    }, 0);
    
    const total = subtotal + taxAmount;
    
    setInvoice({
      ...invoice,
      items,
      subtotal,
      taxAmount,
      total
    });
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 10 }]
    });
  };

  const removeItem = (index) => {
    const items = [...invoice.items];
    items.splice(index, 1);
    
    // 小計、消費税、合計金額の再計算
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 各品目ごとの消費税を計算
    const taxAmount = items.reduce((sum, item) => {
      const itemTaxRate = parseFloat(item.taxRate) || 0;
      const itemAmount = parseFloat(item.amount) || 0;
      return sum + Math.round(itemAmount * (itemTaxRate / 100) * 10) / 10;
    }, 0);
    
    const total = subtotal + taxAmount;
    
    setInvoice({
      ...invoice,
      items,
      subtotal,
      taxAmount,
      total
    });
  };

  const moveItemUp = (index) => {
    if (index === 0) return; // 最初の項目は上に移動できない
    
    const items = [...invoice.items];
    // 現在の項目と1つ上の項目を入れ替える
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
    
    setInvoice({
      ...invoice,
      items
    });
  };

  const moveItemDown = (index) => {
    if (index === invoice.items.length - 1) return; // 最後の項目は下に移動できない
    
    const items = [...invoice.items];
    // 現在の項目と1つ下の項目を入れ替える
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    
    setInvoice({
      ...invoice,
      items
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      [name]: value
    });
  };

  const generatePDF = () => {
    // 選択されたテンプレートを使用
    const templateHTML = invoiceTemplates[invoice.template](invoice);
    
    // プレビュー用要素を取得
    const element = document.createElement('div');
    element.innerHTML = templateHTML;
    element.style.width = '750px'; // 幅を固定
    
    document.body.appendChild(element);
    
    // HTML要素をキャンバスに変換
    html2canvas(element, {
      scale: 2, // 高解像度のキャンバスを生成
      useCORS: true,
      logging: false,
      letterRendering: true
    }).then(canvas => {
      document.body.removeChild(element);
      
      // キャンバスをPDFに変換
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // A4の幅
      const pdfHeight = pdf.internal.pageSize.getHeight(); // A4の高さ
      const margin = 10; // マージン（mm）
      
      // 有効な内容領域
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);
      
      // 内容領域いっぱいに拡大（A4サイズに合わせる）
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save('請求書.pdf');
    });
  };

  const sendPdfByEmail = async () => {
    if (!invoice.sendToEmail) {
      alert('送信先メールアドレスを入力してください');
      return;
    }
    
    try {
      // 送信中メッセージを表示
      alert('メールを送信準備中です。しばらくお待ちください...');
      
      // 選択されたテンプレートを使用
      const templateHTML = invoiceTemplates[invoice.template](invoice);
      
      // プレビュー用要素を取得
      const element = document.createElement('div');
      element.innerHTML = templateHTML;
      element.style.width = '750px'; // 幅を固定
      
      document.body.appendChild(element);
      
      // HTML要素をキャンバスに変換
      const canvas = await html2canvas(element, {
        scale: 2, // 高解像度のキャンバスを生成
        useCORS: true,
        logging: false,
        letterRendering: true
      });
      document.body.removeChild(element);
      
      // キャンバスをPDFに変換
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // A4の幅
      const pdfHeight = pdf.internal.pageSize.getHeight(); // A4の高さ
      const margin = 10; // マージン（mm）
      
      // 有効な内容領域
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);
      
      // 内容領域いっぱいに拡大（A4サイズに合わせる）
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      
      // PDFをBase64形式で取得
      const pdfBase64 = pdf.output('datauristring');
      
      // Google Apps Scriptにデータを送信
      const response = await fetch('https://script.google.com/macros/s/AKfycbz1ESTp4jKMchWFHLBV0wwrRm52yt4rRlUQ4Ve1KYmyST-QOqz3dVE49dTK_xmbTDKM/exec', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          to: invoice.sendToEmail,
          subject: `請求書 ${invoice.invoiceNumber}`,
          body: `${invoice.client.name} 様

請求書をお送りします。ご確認ください。

${invoice.company.name}`
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('メールを送信しました');
      } else {
        throw new Error(result.error || '送信に失敗しました');
      }
      
    } catch (error) {
      console.error('メール送信中にエラーが発生しました:', error);
      alert(`メール送信中にエラーが発生しました: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>請求書作成ツール</h1>
        
        <div className="invoice-form">
          <h2>請求書情報</h2>
          <div className="form-row">
            <div className="form-group">
              <label>請求書番号</label>
              <input 
                type="text" 
                name="invoiceNumber" 
                value={invoice.invoiceNumber} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>発行日</label>
              <input 
                type="date" 
                name="issueDate" 
                value={invoice.issueDate} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>支払期限</label>
              <input 
                type="date" 
                name="dueDate" 
                value={invoice.dueDate} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          
          <h2>請求元情報</h2>
          <div className="form-group">
            <label>会社名</label>
            <input 
              type="text" 
              name="name" 
              value={invoice.company.name} 
              onChange={handleCompanyChange} 
            />
          </div>
          <div className="form-group">
            <label>郵便番号</label>
            <input 
              type="text" 
              name="postalCode" 
              value={invoice.company.postalCode} 
              onChange={handleCompanyChange} 
            />
          </div>
          <div className="form-group">
            <label>住所</label>
            <textarea 
              name="address" 
              value={invoice.company.address} 
              onChange={handleCompanyChange} 
            ></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>電話番号</label>
              <input 
                type="text" 
                name="phone" 
                value={invoice.company.phone} 
                onChange={handleCompanyChange} 
              />
            </div>
            <div className="form-group">
              <label>メール</label>
              <input 
                type="email" 
                name="email" 
                value={invoice.company.email} 
                onChange={handleCompanyChange} 
              />
            </div>
          </div>
          
          <h2>請求先情報</h2>
          <div className="form-group">
            <label>会社名/個人名</label>
            <input 
              type="text" 
              name="name" 
              value={invoice.client.name} 
              onChange={handleClientChange} 
            />
          </div>
          <div className="form-group">
            <label>郵便番号</label>
            <input 
              type="text" 
              name="postalCode" 
              value={invoice.client.postalCode} 
              onChange={handleClientChange} 
            />
          </div>
          <div className="form-group">
            <label>住所</label>
            <textarea 
              name="address" 
              value={invoice.client.address} 
              onChange={handleClientChange} 
            ></textarea>
          </div>
          
          <h2>銀行振込先情報</h2>
          <div className="form-group">
            <label>銀行名</label>
            <input 
              type="text" 
              name="bankName" 
              value={invoice.bankInfo.bankName} 
              onChange={handleBankInfoChange} 
            />
          </div>
          <div className="form-group">
            <label>支店名</label>
            <input 
              type="text" 
              name="branchName" 
              value={invoice.bankInfo.branchName} 
              onChange={handleBankInfoChange} 
            />
          </div>
          <div className="form-group">
            <label>口座種類</label>
            <input 
              type="text" 
              name="accountType" 
              value={invoice.bankInfo.accountType} 
              onChange={handleBankInfoChange} 
            />
          </div>
          <div className="form-group">
            <label>口座番号</label>
            <input 
              type="text" 
              name="accountNumber" 
              value={invoice.bankInfo.accountNumber} 
              onChange={handleBankInfoChange} 
            />
          </div>
          <div className="form-group">
            <label>口座名義</label>
            <input 
              type="text" 
              name="accountName" 
              value={invoice.bankInfo.accountName} 
              onChange={handleBankInfoChange} 
            />
          </div>
          
          <h2>品目</h2>
          {invoice.items.map((item, index) => (
            <div className="item-row" key={index}>
              <div className="item-controls">
                <button
                  type="button"
                  className="move-item-up"
                  onClick={() => moveItemUp(index)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="move-item-down"
                  onClick={() => moveItemDown(index)}
                  disabled={index === invoice.items.length - 1}
                >
                  ↓
                </button>
              </div>
              <div className="form-group description">
                <label>品目</label>
                <input 
                  type="text" 
                  name="description" 
                  value={item.description} 
                  onChange={(e) => handleItemChange(index, e)} 
                />
              </div>
              <div className="form-group quantity">
                <label>数量</label>
                <input 
                  type="number" 
                  name="quantity" 
                  value={item.quantity} 
                  onChange={(e) => handleItemChange(index, e)} 
                />
              </div>
              <div className="form-group unit-price">
                <label>単価</label>
                <input 
                  type="number" 
                  name="unitPrice" 
                  value={item.unitPrice} 
                  onChange={(e) => handleItemChange(index, e)} 
                />
              </div>
              <div className="form-group tax-rate">
                <label>税率</label>
                <select
                  name="taxRate"
                  value={item.taxRate}
                  onChange={(e) => handleItemChange(index, e)}
                >
                  <option value="8">8%</option>
                  <option value="10">10%</option>
                </select>
              </div>
              <div className="form-group amount">
                <label>金額</label>
                <input 
                  type="number" 
                  name="amount" 
                  value={item.amount} 
                  readOnly 
                />
              </div>
              {index > 0 && (
                <button 
                  type="button" 
                  className="remove-item" 
                  onClick={() => removeItem(index)}
                >
                  削除
                </button>
              )}
            </div>
          ))}
          
          <button type="button" className="add-item" onClick={addItem}>
            品目を追加
          </button>
          
          <div className="totals">
            <div className="form-row">
              <div className="form-group">
                <label>小計</label>
                <input 
                  type="number" 
                  name="subtotal" 
                  value={invoice.subtotal} 
                  readOnly 
                />
              </div>
              <div className="form-group">
                <label>消費税額</label>
                <input 
                  type="number" 
                  name="taxAmount" 
                  value={invoice.taxAmount} 
                  readOnly 
                />
              </div>
              <div className="form-group">
                <label>合計金額</label>
                <input 
                  type="number" 
                  name="total" 
                  value={invoice.total} 
                  readOnly 
                />
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>備考</label>
            <textarea 
              name="notes" 
              value={invoice.notes} 
              onChange={handleInputChange} 
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>メール送信先</label>
            <input
              type="email"
              name="sendToEmail"
              value={invoice.sendToEmail}
              onChange={handleInputChange}
              placeholder="example@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>テンプレート選択</label>
            <select
              name="template"
              value={invoice.template}
              onChange={handleInputChange}
            >
              <option value="standard">標準</option>
              <option value="modern">モダン</option>
            </select>
          </div>
          
          <div className="actions">
            <button className="generate-pdf" onClick={generatePDF}>
              PDFをダウンロード
            </button>
            <button className="send-email" onClick={sendPdfByEmail}>
              メールで送信
            </button>
          </div>
        </div>
      </div>
      <div className="footer-notice">
        <p>※ このツールで入力された情報はサーバーに一切保存されません。</p>
        <p>※ ソースコードは <a href="https://github.com/akira1110/invoice-web2" target="_blank" rel="noopener noreferrer">GitHub</a> で公開しています。</p>
      </div>
    </div>
  );
}

export default App;
