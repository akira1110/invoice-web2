import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

// 日本語フォントのサポート
import 'jspdf-autotable';

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
      { description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ],
    subtotal: 0,
    taxRate: 10,
    taxAmount: 0,
    total: 0,
    notes: '振込手数料はご負担願います。',
    sendToEmail: ''
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
    if (name === 'quantity' || name === 'unitPrice') {
      const quantity = name === 'quantity' ? parseFloat(value) || 0 : parseFloat(items[index].quantity) || 0;
      const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(items[index].unitPrice) || 0;
      items[index].amount = quantity * unitPrice;
    }
    
    // 小計、消費税、合計金額の計算
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxAmount = Math.round(subtotal * (invoice.taxRate / 100) * 10) / 10; // 小数点第1位で四捨五入
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
      items: [...invoice.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    const items = [...invoice.items];
    items.splice(index, 1);
    
    // 小計、消費税、合計金額の再計算
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxAmount = Math.round(subtotal * (invoice.taxRate / 100) * 10) / 10; // 小数点第1位で四捨五入
    const total = subtotal + taxAmount;
    
    setInvoice({
      ...invoice,
      items,
      subtotal,
      taxAmount,
      total
    });
  };

  const handleTaxRateChange = (e) => {
    const taxRate = parseFloat(e.target.value) || 0;
    const taxAmount = Math.round(invoice.subtotal * (taxRate / 100) * 10) / 10; // 小数点第1位で四捨五入
    const total = invoice.subtotal + taxAmount;
    
    setInvoice({
      ...invoice,
      taxRate,
      taxAmount,
      total
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      [name]: value
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
      
      // プレビュー用要素を取得（generatePDFと同じ処理）
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="invoice-preview" style="font-family: sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          <h1 style="text-align: center; margin-bottom: 20px; font-size: 24px;">請求書</h1>
          
          <div style="margin-bottom: 20px;">
            <p><strong>請求書番号:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>発行日:</strong> ${invoice.issueDate}</p>
            <p><strong>支払期限:</strong> ${invoice.dueDate}</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h3 style="margin-bottom: 10px;">請求元:</h3>
              <p>${invoice.company.name}</p>
              <p>〒${invoice.company.postalCode}</p>
              <p>${invoice.company.address}</p>
              <p>電話: ${invoice.company.phone}</p>
              <p>メール: ${invoice.company.email}</p>
            </div>
            <div>
              <h3 style="margin-bottom: 10px;">請求先:</h3>
              <p>${invoice.client.name}</p>
              <p>〒${invoice.client.postalCode}</p>
              <p>${invoice.client.address}</p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #ddd;">
                <th style="text-align: left; padding: 10px;">品目</th>
                <th style="text-align: right; padding: 10px;">数量</th>
                <th style="text-align: right; padding: 10px;">単価</th>
                <th style="text-align: right; padding: 10px;">金額</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px;">${item.description}</td>
                  <td style="text-align: right; padding: 10px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 10px;">¥${parseFloat(item.unitPrice).toLocaleString()}</td>
                  <td style="text-align: right; padding: 10px;">¥${parseFloat(item.amount).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-left: auto; width: 250px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <p><strong>小計:</strong></p>
              <p>¥${invoice.subtotal.toLocaleString()}</p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <p><strong>消費税 (${invoice.taxRate}%):</strong></p>
              <p>¥${invoice.taxAmount.toLocaleString()}</p>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 2px solid #ddd; padding-top: 10px;">
              <p>合計金額:</p>
              <p>¥${invoice.total.toLocaleString()}</p>
            </div>
          </div>
          
          <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 10px;">振込先情報:</h3>
            <p><strong>銀行名:</strong> ${invoice.bankInfo.bankName}</p>
            <p><strong>支店名:</strong> ${invoice.bankInfo.branchName}</p>
            <p><strong>口座種類:</strong> ${invoice.bankInfo.accountType}</p>
            <p><strong>口座番号:</strong> ${invoice.bankInfo.accountNumber}</p>
            <p><strong>口座名義:</strong> ${invoice.bankInfo.accountName}</p>
          </div>
          
          ${invoice.notes ? `
            <div style="margin-top: 40px;">
              <h3 style="margin-bottom: 10px;">備考:</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
        </div>
      `;
      
      document.body.appendChild(element);
      
      // HTML要素をキャンバスに変換
      const canvas = await html2canvas(element);
      document.body.removeChild(element);
      
      // キャンバスをPDFに変換
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4サイズの幅
      const pageHeight = 297; // A4サイズの高さ
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 複数ページに対応
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
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

  const generatePDF = () => {
    // プレビュー用要素を取得
    const element = document.createElement('div');
    element.innerHTML = `
      <div class="invoice-preview" style="font-family: sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
        <h1 style="text-align: center; margin-bottom: 20px; font-size: 24px;">請求書</h1>
        
        <div style="margin-bottom: 20px;">
          <p><strong>請求書番号:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>発行日:</strong> ${invoice.issueDate}</p>
          <p><strong>支払期限:</strong> ${invoice.dueDate}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin-bottom: 10px;">請求元:</h3>
            <p>${invoice.company.name}</p>
            <p>〒${invoice.company.postalCode}</p>
            <p>${invoice.company.address}</p>
            <p>電話: ${invoice.company.phone}</p>
            <p>メール: ${invoice.company.email}</p>
          </div>
          <div>
            <h3 style="margin-bottom: 10px;">請求先:</h3>
            <p>${invoice.client.name}</p>
            <p>〒${invoice.client.postalCode}</p>
            <p>${invoice.client.address}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd;">
              <th style="text-align: left; padding: 10px;">品目</th>
              <th style="text-align: right; padding: 10px;">数量</th>
              <th style="text-align: right; padding: 10px;">単価</th>
              <th style="text-align: right; padding: 10px;">金額</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${item.description}</td>
                <td style="text-align: right; padding: 10px;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px;">¥${parseFloat(item.unitPrice).toLocaleString()}</td>
                <td style="text-align: right; padding: 10px;">¥${parseFloat(item.amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-left: auto; width: 250px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <p><strong>小計:</strong></p>
            <p>¥${invoice.subtotal.toLocaleString()}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <p><strong>消費税 (${invoice.taxRate}%):</strong></p>
            <p>¥${invoice.taxAmount.toLocaleString()}</p>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 2px solid #ddd; padding-top: 10px;">
            <p>合計金額:</p>
            <p>¥${invoice.total.toLocaleString()}</p>
          </div>
        </div>
        
        <div style="margin-top: 30px;">
          <h3 style="margin-bottom: 10px;">振込先情報:</h3>
          <p><strong>銀行名:</strong> ${invoice.bankInfo.bankName}</p>
          <p><strong>支店名:</strong> ${invoice.bankInfo.branchName}</p>
          <p><strong>口座種類:</strong> ${invoice.bankInfo.accountType}</p>
          <p><strong>口座番号:</strong> ${invoice.bankInfo.accountNumber}</p>
          <p><strong>口座名義:</strong> ${invoice.bankInfo.accountName}</p>
        </div>
        
        ${invoice.notes ? `
          <div style="margin-top: 40px;">
            <h3 style="margin-bottom: 10px;">備考:</h3>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(element);
    
    // HTML要素をキャンバスに変換
    html2canvas(element).then(canvas => {
      document.body.removeChild(element);
      
      // キャンバスをPDFに変換
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4サイズの幅
      const pageHeight = 297; // A4サイズの高さ
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 複数ページに対応
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('請求書.pdf');
    });
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
                <label>消費税率 (%)</label>
                <input 
                  type="number" 
                  name="taxRate" 
                  value={invoice.taxRate} 
                  onChange={handleTaxRateChange} 
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
    </div>
  );
}

export default App;
