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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        ${invoice.company.logo ? `<div style="max-width: 200px; max-height: 100px;"><img src="${invoice.company.logo}" style="max-width: 100%; max-height: 100px;"></div>` : ''}
        <h1 style="text-align: center; margin-bottom: 15px; font-size: 20px; ${invoice.company.logo ? 'margin-left: 20px;' : ''}">請求書</h1>
      </div>
      
      <div style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <div style="width: 60%;">
          ${invoice.invoiceNumber ? `<p style="margin: 3px 0;"><strong>請求書番号:</strong> ${invoice.invoiceNumber}</p>` : ''}
          ${invoice.issueDate ? `<p style="margin: 3px 0;"><strong>発行日:</strong> ${invoice.issueDate}</p>` : ''}
          ${invoice.dueDate ? `<p style="margin: 3px 0;"><strong>支払期限:</strong> ${invoice.dueDate}</p>` : ''}
        </div>
        <div style="width: 40%; text-align: right;">
          <p style="margin: 3px 0; font-size: 16px;"><strong>合計金額:</strong> ¥${invoice.total.toLocaleString()}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <div style="width: 45%; margin-right: 5%;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">請求元:</h3>
          <p style="margin: 3px 0; font-size: 12px;">${invoice.company.name}</p>
          ${invoice.company.postalCode ? `<p style="margin: 3px 0; font-size: 12px;">〒${invoice.company.postalCode}</p>` : ''}
          ${invoice.company.address ? `<p style="margin: 3px 0; font-size: 12px;">${invoice.company.address}</p>` : ''}
          ${invoice.company.phone ? `<p style="margin: 3px 0; font-size: 12px;">電話: ${invoice.company.phone}</p>` : ''}
          ${invoice.company.email ? `<p style="margin: 3px 0; font-size: 12px;">メール: ${invoice.company.email}</p>` : ''}
        </div>
        <div style="width: 45%;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">請求先:</h3>
          <p style="margin: 3px 0; font-size: 12px;">${invoice.client.name}</p>
          ${invoice.client.postalCode ? `<p style="margin: 3px 0; font-size: 12px;">〒${invoice.client.postalCode}</p>` : ''}
          ${invoice.client.address ? `<p style="margin: 3px 0; font-size: 12px;">${invoice.client.address}</p>` : ''}
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd; background-color: #f9f9f9;">
            <th style="text-align: left; padding: 5px; width: 35%;">品目</th>
            <th style="text-align: right; padding: 5px; width: 10%;">数量</th>
            <th style="text-align: right; padding: 5px; width: 15%;">単価</th>
            <th style="text-align: right; padding: 5px; width: 10%;">税率</th>
            <th style="text-align: right; padding: 5px; width: 15%;">金額</th>
            <th style="text-align: left; padding: 5px; width: 15%;">備考</th>
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
              <td style="padding: 5px; font-size: 11px;">${item.remarks || ''}</td>
            </tr>
          `).join('')}
          ${Array(Math.max(0, 10 - invoice.items.length)).fill().map(() => `
            <tr style="border-bottom: 1px solid #eee; height: 25px;">
              <td style="padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="text-align: right; padding: 5px;"></td>
              <td style="padding: 5px;"></td>
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
          ${invoice.items.some(item => parseFloat(item.taxRate) === 8) ? `
          <tr>
            <td style="padding: 3px; font-weight: bold; text-align: left;">消費税 (8%):</td>
            <td style="padding: 3px; text-align: right;">¥${Math.round(invoice.items.reduce((sum, item) => {
              const itemTaxRate = parseFloat(item.taxRate) || 0;
              const itemAmount = parseFloat(item.amount) || 0;
              return sum + (itemTaxRate === 8 ? itemAmount * 0.08 : 0);
            }, 0)).toLocaleString()}</td>
          </tr>
          ` : ''}
          ${invoice.items.some(item => parseFloat(item.taxRate) === 10) ? `
          <tr>
            <td style="padding: 3px; font-weight: bold; text-align: left;">消費税 (10%):</td>
            <td style="padding: 3px; text-align: right;">¥${Math.round(invoice.items.reduce((sum, item) => {
              const itemTaxRate = parseFloat(item.taxRate) || 0;
              const itemAmount = parseFloat(item.amount) || 0;
              return sum + (itemTaxRate === 10 ? itemAmount * 0.10 : 0);
            }, 0)).toLocaleString()}</td>
          </tr>
          ` : ''}
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2;">消費税合計</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right;">¥${invoice.taxAmount.toLocaleString()}</td>
          </tr>
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2;">合　計 (税込)</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right; font-weight: bold;">¥${invoice.total.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-top: 15px; font-size: 12px;">
        <h3 style="margin: 0 0 5px 0; font-size: 14px;">振込先情報:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${invoice.bankInfo.bankName ? `
            <td style="padding: 3px; width: 20%;"><strong>銀行名:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.bankName}</td>
            ` : ''}
            ${invoice.bankInfo.branchName ? `
            <td style="padding: 3px; width: 20%;"><strong>支店名:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.branchName}</td>
            ` : ''}
          </tr>
          <tr>
            ${invoice.bankInfo.accountType ? `
            <td style="padding: 3px;"><strong>口座種類:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.accountType}</td>
            ` : ''}
            ${invoice.bankInfo.accountNumber ? `
            <td style="padding: 3px;"><strong>口座番号:</strong></td>
            <td style="padding: 3px;">${invoice.bankInfo.accountNumber}</td>
            ` : ''}
          </tr>
          ${invoice.bankInfo.accountName ? `
          <tr>
            <td style="padding: 3px;"><strong>口座名義:</strong></td>
            <td style="padding: 3px;" colspan="3">${invoice.bankInfo.accountName}</td>
          </tr>
          ` : ''}
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
        ${invoice.company.logo ? `<div style="max-width: 200px; max-height: 100px;"><img src="${invoice.company.logo}" style="max-width: 100%; max-height: 100px;"></div>` : ''}
        <div style="display: flex; flex-direction: column; align-items: ${invoice.company.logo ? 'flex-end' : 'space-between'}; width: 100%;">
          <h1 style="font-size: 20px; color: #3498db; margin: 0;">請求書</h1>
          <div style="text-align: right;">
            ${invoice.invoiceNumber ? `<p style="margin: 2px 0; font-size: 12px;"><strong>請求書番号:</strong> #${invoice.invoiceNumber}</p>` : ''}
            ${invoice.issueDate ? `<p style="margin: 2px 0; font-size: 12px;"><strong>発行日:</strong> ${invoice.issueDate}</p>` : ''}
            ${invoice.dueDate ? `<p style="margin: 2px 0; font-size: 12px;"><strong>支払期限:</strong> ${invoice.dueDate}</p>` : ''}
          </div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <div style="width: 47%; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">請求元</h3>
          <p style="margin: 2px 0; font-size: 12px;"><strong>${invoice.company.name}</strong></p>
          ${invoice.company.postalCode ? `<p style="margin: 2px 0; font-size: 12px;">〒${invoice.company.postalCode}</p>` : ''}
          ${invoice.company.address ? `<p style="margin: 2px 0; font-size: 12px;">${invoice.company.address}</p>` : ''}
          ${invoice.company.phone ? `<p style="margin: 2px 0; font-size: 12px;">電話: ${invoice.company.phone}</p>` : ''}
          ${invoice.company.email ? `<p style="margin: 2px 0; font-size: 12px;">メール: ${invoice.company.email}</p>` : ''}
        </div>
        <div style="width: 47%; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">請求先</h3>
          <p style="margin: 2px 0; font-size: 12px;"><strong>${invoice.client.name}</strong></p>
          ${invoice.client.postalCode ? `<p style="margin: 2px 0; font-size: 12px;">〒${invoice.client.postalCode}</p>` : ''}
          ${invoice.client.address ? `<p style="margin: 2px 0; font-size: 12px;">${invoice.client.address}</p>` : ''}
        </div>
      </div>
      
      <div style="background-color: white; padding: 10px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #3498db; color: white;">
              <th style="text-align: left; padding: 5px; border-radius: 3px 0 0 0; width: 35%;">品目</th>
              <th style="text-align: right; padding: 5px; width: 10%;">数量</th>
              <th style="text-align: right; padding: 5px; width: 15%;">単価</th>
              <th style="text-align: right; padding: 5px; width: 10%;">税率</th>
              <th style="text-align: right; padding: 5px; width: 15%;">金額</th>
              <th style="text-align: left; padding: 5px; border-radius: 0 3px 0 0; width: 15%;">備考</th>
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
                <td style="padding: 5px; font-size: 11px;">${item.remarks || ''}</td>
              </tr>
            `).join('')}
            ${Array(Math.max(0, 10 - invoice.items.length)).fill().map(() => `
              <tr style="border-bottom: 1px solid #eee; height: 22px;">
                <td style="padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="text-align: right; padding: 5px;"></td>
                <td style="padding: 5px;"></td>
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
          ${invoice.items.some(item => parseFloat(item.taxRate) === 8) ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="margin: 0; font-size: 12px;"><strong>消費税 (8%):</strong></p>
            <p style="margin: 0; font-size: 12px;">¥${Math.round(invoice.items.reduce((sum, item) => {
              const itemTaxRate = parseFloat(item.taxRate) || 0;
              const itemAmount = parseFloat(item.amount) || 0;
              return sum + (itemTaxRate === 8 ? itemAmount * 0.08 : 0);
            }, 0)).toLocaleString()}</p>
          </div>
          ` : ''}
          ${invoice.items.some(item => parseFloat(item.taxRate) === 10) ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="margin: 0; font-size: 12px;"><strong>消費税 (10%):</strong></p>
            <p style="margin: 0; font-size: 12px;">¥${Math.round(invoice.items.reduce((sum, item) => {
              const itemTaxRate = parseFloat(item.taxRate) || 0;
              const itemAmount = parseFloat(item.amount) || 0;
              return sum + (itemTaxRate === 10 ? itemAmount * 0.10 : 0);
            }, 0)).toLocaleString()}</p>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid #eee;">
            <p style="margin: 0; font-size: 12px;"><strong>消費税合計:</strong></p>
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
          ${invoice.bankInfo.bankName ? `<p style="margin: 2px 0;"><strong>銀行名:</strong> ${invoice.bankInfo.bankName}</p>` : ''}
          ${invoice.bankInfo.branchName ? `<p style="margin: 2px 0;"><strong>支店名:</strong> ${invoice.bankInfo.branchName}</p>` : ''}
          ${invoice.bankInfo.accountType ? `<p style="margin: 2px 0;"><strong>口座種類:</strong> ${invoice.bankInfo.accountType}</p>` : ''}
          ${invoice.bankInfo.accountNumber ? `<p style="margin: 2px 0;"><strong>口座番号:</strong> ${invoice.bankInfo.accountNumber}</p>` : ''}
          ${invoice.bankInfo.accountName ? `<p style="margin: 2px 0; grid-column: span 2;"><strong>口座名義:</strong> ${invoice.bankInfo.accountName}</p>` : ''}
        </div>
      </div>
      
      ${invoice.notes ? `
        <div style="margin-top: 15px; padding: 10px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 3px;">
          <h3 style="color: #3498db; margin: 0 0 5px 0; font-size: 14px;">備考</h3>
          <p style="margin: 0; font-size: 12px;">${invoice.notes}</p>
        </div>
      ` : ''}
    </div>
  `,

  // 伝統的な日本語請求書テンプレート
  japanese_traditional: (invoice) => `
    <div class="invoice-preview" style="font-family: sans-serif; padding: 15px; max-width: 750px; margin: 0 auto; color: #000;">
      <!-- ヘッダー部分 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div style="width: 50%;">
          <div style="background-color: #4472C4; border-radius: 10px 10px 0 0; padding: 10px 20px; margin-bottom: 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">請求書</h1>
          </div>
          <div style="padding: 10px 0;">
            ${invoice.client.postalCode || invoice.client.address ? 
            `<p style="margin: 0 0 5px 0; font-size: 12px;">
              ${invoice.client.postalCode ? `〒 ${invoice.client.postalCode}` : ''} 
              ${invoice.client.address || ''}
            </p>` : ''}
            <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${invoice.client.name || ''}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px;">
              ${invoice.client.departmentName || ''}
              ${invoice.client.contactPerson ? `担当者：${invoice.client.contactPerson}　様` : ''}
            </p>
          </div>
        </div>
        <div style="width: 47%; text-align: right;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              ${invoice.invoiceNumber ? 
              `<td style="text-align: right; font-size: 12px; padding: 2px;">No : ${invoice.invoiceNumber}</td>` : ''}
              ${invoice.issueDate ? 
              `<td style="text-align: right; font-size: 12px; padding: 2px;">請求日 : ${invoice.issueDate}</td>` : ''}
            </tr>
          </table>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <!-- 企業ロゴと登録印の位置を入れ替えた -->
            <div${invoice.templateSpecific.japanese_traditional.hasStamp ? ' style="max-width: 70%;"' : ' style="width: 100%; text-align: center;"'}>
              ${invoice.company.logo ? `<img src="${invoice.company.logo}" style="max-height: 60px; max-width: 200px;">` : 
              `<div style="font-weight: bold; font-size: 20px;">${invoice.company.name || ''}</div>`}
            </div>
            ${invoice.templateSpecific.japanese_traditional.hasStamp ? 
            `<div style="border: 1px solid #000; padding: 5px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
              ${invoice.company.stampImage ? `<img src="${invoice.company.stampImage}" style="max-width: 50px; max-height: 50px;">` : ''}
            </div>` : ''}
          </div>
          <div style="text-align: left; margin-top: 10px;">
            <p style="margin: 0 0 3px 0; font-size: 12px; font-weight: bold;">${invoice.company.name || ''}</p>
            ${invoice.company.postalCode || invoice.company.address ? 
            `<p style="margin: 0 0 3px 0; font-size: 12px;">
              ${invoice.company.postalCode ? `〒 ${invoice.company.postalCode}` : ''} 
              ${invoice.company.address || ''}
            </p>` : ''}
            ${invoice.company.phone || invoice.company.email ? 
            `<p style="margin: 0 0 3px 0; font-size: 12px;">
              ${invoice.company.phone ? `<span style="margin-right: 10px;">☎ ${invoice.company.phone}</span>` : ''}
              ${invoice.company.email ? `<span>✉ ${invoice.company.email}</span>` : ''}
            </p>` : ''}
          </div>
          ${invoice.bankInfo.bankName || invoice.bankInfo.branchName || invoice.bankInfo.accountType || invoice.bankInfo.accountNumber || invoice.bankInfo.accountName ? 
          `<div style="border: 1px solid #000; padding: 5px; margin-top: 10px; text-align: left;">
            <table style="width: 100%; border-collapse: collapse;">
              ${invoice.bankInfo.bankName || invoice.bankInfo.branchName ? `
              <tr>
                <td style="font-size: 12px;">${invoice.bankInfo.bankName || ''} ${invoice.bankInfo.branchName || ''}</td>
              </tr>
              ` : ''}
              ${invoice.bankInfo.accountType || invoice.bankInfo.accountNumber || invoice.bankInfo.accountName ? `
              <tr>
                <td style="font-size: 12px;">${invoice.bankInfo.accountType ? `(${invoice.bankInfo.accountType}) ` : ''}${invoice.bankInfo.accountNumber || ''} ${invoice.bankInfo.accountName || ''}</td>
              </tr>
              ` : ''}
            </table>
          </div>` : ''}
        </div>
      </div>

      <!-- 請求金額部分 -->
      <div style="border: 1px solid #000; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 20%; padding: 10px 15px; font-size: 14px; font-weight: bold; text-align: center; border-right: 1px solid #000;">請求金額(税込)</td>
            <td style="width: 80%; padding: 10px 15px; font-size: 20px; font-weight: bold; text-align: right;">¥${invoice.total.toLocaleString()}-</td>
          </tr>
        </table>
      </div>

      <!-- 明細テーブル -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="border: 1px solid #000; background-color: #f2f2f2;">
            <th style="padding: 5px; text-align: center; border: 1px solid #000; width: 40%;">商品名 / 品目</th>
            <th style="padding: 5px; text-align: center; border: 1px solid #000; width: 15%;">数　量</th>
            <th style="padding: 5px; text-align: center; border: 1px solid #000; width: 15%;">単　価</th>
            <th style="padding: 5px; text-align: center; border: 1px solid #000; width: 15%;">金　額</th>
            <th style="padding: 5px; text-align: center; border: 1px solid #000; width: 15%;">備　考</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => `
            <tr style="border: 1px solid #000;">
              <td style="padding: 5px; border: 1px solid #000; font-size: 12px;">${item.description || ''}</td>
              <td style="padding: 5px; border: 1px solid #000; text-align: right; font-size: 12px;">${parseFloat(item.quantity || 0).toLocaleString()}</td>
              <td style="padding: 5px; border: 1px solid #000; text-align: right; font-size: 12px;">${parseFloat(item.unitPrice || 0).toLocaleString()}</td>
              <td style="padding: 5px; border: 1px solid #000; text-align: right; font-size: 12px;">${parseFloat(item.amount || 0).toLocaleString()}</td>
              <td style="padding: 5px; border: 1px solid #000; font-size: 12px;">${item.remarks || ''}</td>
            </tr>
          `).join('')}
          ${Array(Math.max(0, 15 - invoice.items.length)).fill().map(() => `
            <tr style="border: 1px solid #000; height: 25px;">
              <td style="padding: 5px; border: 1px solid #000;"></td>
              <td style="padding: 5px; border: 1px solid #000;"></td>
              <td style="padding: 5px; border: 1px solid #000;"></td>
              <td style="padding: 5px; border: 1px solid #000;"></td>
              <td style="padding: 5px; border: 1px solid #000;"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 金額情報 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="width: 50%; font-size: 12px;">
          ${invoice.dueDate ? `<p style="margin: 0 0 5px 0;">支払期限：${invoice.dueDate}</p>` : ''}
        </div>
        <table style="width: 45%; border-collapse: collapse;">
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2; width: 33%;">小　計 (税抜)</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right; width: 67%;">¥${invoice.subtotal.toLocaleString()}</td>
          </tr>
          ${invoice.items.some(item => parseFloat(item.taxRate) === 8) ? `
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2;">消費税 (8%)</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right;">¥${Math.round(invoice.items.reduce((sum, item) => {
              const itemTaxRate = parseFloat(item.taxRate) || 0;
              const itemAmount = parseFloat(item.amount) || 0;
              return sum + (itemTaxRate === 8 ? itemAmount * 0.08 : 0);
            }, 0)).toLocaleString()}</td>
          </tr>
          ` : ''}
          ${invoice.items.some(item => parseFloat(item.taxRate) === 10) ? `
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2;">消費税 (10%)</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right;">¥${Math.round(invoice.items.reduce((sum, item) => {
              const itemTaxRate = parseFloat(item.taxRate) || 0;
              const itemAmount = parseFloat(item.amount) || 0;
              return sum + (itemTaxRate === 10 ? itemAmount * 0.10 : 0);
            }, 0)).toLocaleString()}</td>
          </tr>
          ` : ''}
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2;">消費税合計</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right;">¥${invoice.taxAmount.toLocaleString()}</td>
          </tr>
          <tr style="border: 1px solid #000;">
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: center; background-color: #f2f2f2;">合　計 (税込)</td>
            <td style="padding: 5px 10px; border: 1px solid #000; text-align: right; font-weight: bold;">¥${invoice.total.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- 備考欄 -->
      ${invoice.notes ? `
      <div style="border: 1px solid #000; padding: 10px; min-height: 100px; margin-bottom: 20px;">
        <p style="margin: 0 0 5px 0; font-weight: bold;">備考欄：</p>
        <p style="margin: 0;">${invoice.notes}</p>
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
      email: '',
      logo: '',
      stampImage: ''
    },
    client: {
      name: '',
      address: '',
      postalCode: '',
      departmentName: '',
      contactPerson: ''
    },
    bankInfo: {
      bankName: '',
      branchName: '',
      accountType: '',
      accountNumber: '',
      accountName: ''
    },
    items: [
      { description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 10, remarks: '' }
    ],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    notes: '',
    // デフォルトテンプレート
    template: 'standard',
    // テンプレート固有の設定
    templateSpecific: {
      japanese_traditional: {
        hasStamp: true
      }
    },
    // 端数処理方法（デフォルトは切り捨て）
    roundingMethod: 'floor'
  });

  // トグルの状態を管理するステート
  const [toggleState, setToggleState] = useState({
    companyInfo: false,
    clientInfo: false,
    bankInfo: false,
    itemsInfo: true  // 品目セクションの初期状態は開いている
  });

  // 各テンプレートで表示する項目を定義
  const templateFields = {
    standard: {
      clientContact: false,
      clientDepartment: false,
      stampField: false
    },
    modern: {
      clientContact: false,
      clientDepartment: false,
      stampField: false
    },
    japanese_traditional: {
      clientContact: true,  // 担当者名フィールド
      clientDepartment: true, // 部署名フィールド
      stampField: true     // 印鑑欄表示
    }
  };

  const invoiceRef = useRef(null);

  // サンプル表示用の状態を追加
  const [samplePreview, setSamplePreview] = useState({
    show: false,
    template: ''
  });

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

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice({
          ...invoice,
          company: {
            ...invoice.company,
            logo: reader.result
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice({
          ...invoice,
          company: {
            ...invoice.company,
            stampImage: reader.result
          }
        });
      };
      reader.readAsDataURL(file);
    }
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
    
    // 税率ごとに品目をグループ化
    const taxRate8Items = items.filter(item => (parseFloat(item.taxRate) || 0) === 8);
    const taxRate10Items = items.filter(item => (parseFloat(item.taxRate) || 0) === 10);
    
    // 各税率ごとの小計を計算
    const subtotal8 = taxRate8Items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const subtotal10 = taxRate10Items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 選択された端数処理方法に基づいて税額を計算
    let taxAmount8 = 0;
    let taxAmount10 = 0;
    
    if (invoice.roundingMethod === 'floor') {
      // 切り捨て
      taxAmount8 = Math.floor(subtotal8 * 0.08);
      taxAmount10 = Math.floor(subtotal10 * 0.10);
    } else if (invoice.roundingMethod === 'ceil') {
      // 切り上げ
      taxAmount8 = Math.ceil(subtotal8 * 0.08);
      taxAmount10 = Math.ceil(subtotal10 * 0.10);
    } else {
      // 四捨五入 (デフォルト)
      taxAmount8 = Math.round(subtotal8 * 0.08);
      taxAmount10 = Math.round(subtotal10 * 0.10);
    }
    
    const taxAmount = taxAmount8 + taxAmount10;
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
      items: [...invoice.items, { description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 10, remarks: '' }]
    });
  };

  const removeItem = (index) => {
    const items = [...invoice.items];
    items.splice(index, 1);
    
    // 小計、消費税、合計金額の再計算
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 税率ごとに品目をグループ化
    const taxRate8Items = items.filter(item => (parseFloat(item.taxRate) || 0) === 8);
    const taxRate10Items = items.filter(item => (parseFloat(item.taxRate) || 0) === 10);
    
    // 各税率ごとの小計を計算
    const subtotal8 = taxRate8Items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const subtotal10 = taxRate10Items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 選択された端数処理方法に基づいて税額を計算
    let taxAmount8 = 0;
    let taxAmount10 = 0;
    
    if (invoice.roundingMethod === 'floor') {
      // 切り捨て
      taxAmount8 = Math.floor(subtotal8 * 0.08);
      taxAmount10 = Math.floor(subtotal10 * 0.10);
    } else if (invoice.roundingMethod === 'ceil') {
      // 切り上げ
      taxAmount8 = Math.ceil(subtotal8 * 0.08);
      taxAmount10 = Math.ceil(subtotal10 * 0.10);
    } else {
      // 四捨五入 (デフォルト)
      taxAmount8 = Math.round(subtotal8 * 0.08);
      taxAmount10 = Math.round(subtotal10 * 0.10);
    }
    
    const taxAmount = taxAmount8 + taxAmount10;
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
    
    if (name === 'template') {
      // テンプレート変更時、テンプレート固有の初期値を設定
      let updatedInvoice = { ...invoice, [name]: value };
      
      if (value === 'japanese_traditional') {
        // 日本語テンプレート用のデフォルト値を設定
        updatedInvoice.notes = 'お振込手数料は御社にてご負担願います。';
      }
      
      setInvoice(updatedInvoice);
    } else if (name === 'roundingMethod') {
      // 端数処理方法が変更された場合、税額を再計算
      const items = [...invoice.items];
      
      // 小計
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      
      // 税率ごとに品目をグループ化
      const taxRate8Items = items.filter(item => (parseFloat(item.taxRate) || 0) === 8);
      const taxRate10Items = items.filter(item => (parseFloat(item.taxRate) || 0) === 10);
      
      // 各税率ごとの小計を計算
      const subtotal8 = taxRate8Items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const subtotal10 = taxRate10Items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      
      // 選択された端数処理方法に基づいて税額を計算
      let taxAmount8 = 0;
      let taxAmount10 = 0;
      
      if (value === 'floor') {
        // 切り捨て
        taxAmount8 = Math.floor(subtotal8 * 0.08);
        taxAmount10 = Math.floor(subtotal10 * 0.10);
      } else if (value === 'ceil') {
        // 切り上げ
        taxAmount8 = Math.ceil(subtotal8 * 0.08);
        taxAmount10 = Math.ceil(subtotal10 * 0.10);
      } else {
        // 四捨五入 (デフォルト)
        taxAmount8 = Math.round(subtotal8 * 0.08);
        taxAmount10 = Math.round(subtotal10 * 0.10);
      }
      
      const taxAmount = taxAmount8 + taxAmount10;
      const total = subtotal + taxAmount;
      
      setInvoice({
        ...invoice,
        [name]: value,
        subtotal,
        taxAmount,
        total
      });
    } else {
      setInvoice({
        ...invoice,
        [name]: value
      });
    }
  };

  // セクションの開閉を切り替える関数
  const toggleSection = (section) => {
    setToggleState({
      ...toggleState,
      [section]: !toggleState[section]
    });
  };

  // セクションが入力済みかをチェックする関数
  const isSectionFilled = (section) => {
    switch(section) {
      case 'companyInfo':
        return !!invoice.company.name;
      case 'clientInfo':
        return !!invoice.client.name;
      case 'bankInfo':
        return !!(invoice.bankInfo.bankName || invoice.bankInfo.accountNumber);
      default:
        return false;
    }
  };

  const validateRequiredFields = () => {
    const missingFields = [];
    
    // 請求元の会社名をチェック
    if (!invoice.company.name.trim()) {
      missingFields.push('請求元の会社名');
    }
    
    // 請求先の会社名/個人名をチェック
    if (!invoice.client.name.trim()) {
      missingFields.push('請求先の会社名/個人名');
    }
    
    // 品目の必須フィールドをチェック
    const invalidItems = invoice.items.filter(
      item => !item.description.trim() || !item.quantity || !item.unitPrice
    );
    
    if (invalidItems.length > 0) {
      missingFields.push('品目情報（品目名、数量、単価）');
    }
    
    return missingFields;
  };

  const generatePDF = () => {
    // 必須項目のバリデーション
    const missingFields = validateRequiredFields();
    
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join('、');
      if (!window.confirm(`以下の必須項目が入力されていませんが、続行しますか？\n\n${fieldsList}`)) {
        return; // キャンセルされた場合は処理を中止
      }
    }
    
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
      
      // キャンバスのアスペクト比を計算
      const canvasRatio = canvas.height / canvas.width;
      
      // 縦横比を維持したままコンテンツをPDFに配置
      const imageWidth = contentWidth;
      const imageHeight = imageWidth * canvasRatio;
      
      pdf.addImage(imgData, 'PNG', margin, margin, imageWidth, imageHeight);
      pdf.save('請求書.pdf');
    });
  };

  const sendPdfByEmail = async () => {
    // メールアドレスのチェック
    if (!invoice.sendToEmail) {
      alert('送信先メールアドレスを入力してください');
      return;
    }
    
    // 必須項目のバリデーション
    const missingFields = validateRequiredFields();
    
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join('、');
      if (!window.confirm(`以下の必須項目が入力されていませんが、続行しますか？\n\n${fieldsList}`)) {
        return; // キャンセルされた場合は処理を中止
      }
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
      
      // キャンバスのアスペクト比を計算
      const canvasRatio = canvas.height / canvas.width;
      
      // 縦横比を維持したままコンテンツをPDFに配置
      const imageWidth = contentWidth;
      const imageHeight = imageWidth * canvasRatio;
      
      pdf.addImage(imgData, 'PNG', margin, margin, imageWidth, imageHeight);
      
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

  // テンプレートで特定のフィールドを表示すべきかを判定
  const shouldShowField = (fieldName) => {
    const currentTemplate = invoice.template;
    return templateFields[currentTemplate] && templateFields[currentTemplate][fieldName];
  };

  // サンプルプレビューを表示する関数
  const showSamplePreview = (template) => {
    setSamplePreview({
      show: true,
      template: template
    });
  };

  // サンプルプレビューを閉じる関数
  const closeSamplePreview = () => {
    setSamplePreview({
      show: false,
      template: ''
    });
  };

  // テンプレート説明テキスト
  const templateDescriptions = {
    standard: 'シンプルで読みやすい基本的なレイアウト。どのような業種にも適した万能なデザインです。',
    modern: '現代的でスタイリッシュなデザイン。青色を基調とした洗練されたレイアウトが特徴です。',
    japanese_traditional: '日本の伝統的な請求書フォーマットを踏襲したデザイン。登録印欄や枠線のある表組みが特徴です。'
  };

  // サンプルデータ
  const sampleData = {
    invoiceNumber: 'INV-2023001',
    issueDate: '2023-05-15',
    dueDate: '2023-06-15',
    company: {
      name: 'サンプル株式会社',
      address: '東京都渋谷区恵比寿1-2-3 サンプルビル5F',
      postalCode: '150-0013',
      phone: '03-1234-5678',
      email: 'info@sample-company.co.jp',
      logo: '',
      stampImage: ''
    },
    client: {
      name: '取引先企業株式会社',
      address: '東京都千代田区丸の内1-1-1 取引先ビル10F',
      postalCode: '100-0005',
      departmentName: '経理部',
      contactPerson: '山田 太郎'
    },
    bankInfo: {
      bankName: 'サンプル銀行',
      branchName: '恵比寿支店',
      accountType: '普通',
      accountNumber: '1234567',
      accountName: 'サンプル（カ'
    },
    items: [
      { description: 'Webサイト制作費', quantity: 1, unitPrice: 350000, amount: 350000, taxRate: 10, remarks: '御社ホームページリニューアル' },
      { description: 'サーバー保守管理費（4月分）', quantity: 1, unitPrice: 50000, amount: 50000, taxRate: 10, remarks: '月額契約' },
      { description: 'SEO対策費', quantity: 1, unitPrice: 100000, amount: 100000, taxRate: 10, remarks: '' }
    ],
    subtotal: 500000,
    taxAmount: 50000,
    total: 550000,
    notes: 'お振込手数料は御社にてご負担願います。\nご不明点がございましたら、担当者までお問い合わせください。',
    // テンプレート固有の設定を追加
    templateSpecific: {
      japanese_traditional: {
        hasStamp: true
      }
    },
    // 端数処理方法（デフォルトは切り捨て）
    roundingMethod: 'floor'
  };

  return (
    <div className="App">
      <div className="container">
        <h1>請求書作成ツール</h1>
        
        <div className="invoice-form">
          <div className="template-selection">
            <h2>テンプレート選択</h2>
            <div className="template-options">
              <div className={`template-option ${invoice.template === 'standard' ? 'selected' : ''}`}>
                <div className="template-preview" onClick={() => handleInputChange({target: {name: 'template', value: 'standard'}})}>
                  <div className="template-thumbnail simple-template">
                    <div className="thumbnail-header">請求書</div>
                    <div className="thumbnail-content">
                      <div className="thumbnail-lines"></div>
                      <div className="thumbnail-table"></div>
                    </div>
                  </div>
                </div>
                <div className="template-description">
                  <p>{templateDescriptions.standard}</p>
                </div>
                <div className="template-actions">
                  <div className="template-name">
                    <input 
                      type="radio" 
                      id="template-standard" 
                      name="template" 
                      value="standard" 
                      checked={invoice.template === 'standard'} 
                      onChange={handleInputChange} 
                    />
                    <label htmlFor="template-standard">シンプル</label>
                  </div>
                  <button 
                    type="button" 
                    className="sample-preview-btn"
                    onClick={() => showSamplePreview('standard')}
                  >
                    サンプル確認
                  </button>
                </div>
              </div>
              
              <div className={`template-option ${invoice.template === 'modern' ? 'selected' : ''}`}>
                <div className="template-preview" onClick={() => handleInputChange({target: {name: 'template', value: 'modern'}})}>
                  <div className="template-thumbnail modern-template">
                    <div className="thumbnail-header modern">請求書</div>
                    <div className="thumbnail-content">
                      <div className="thumbnail-boxes"></div>
                      <div className="thumbnail-table modern"></div>
                    </div>
                  </div>
                </div>
                <div className="template-description">
                  <p>{templateDescriptions.modern}</p>
                </div>
                <div className="template-actions">
                  <div className="template-name">
                    <input 
                      type="radio" 
                      id="template-modern" 
                      name="template" 
                      value="modern" 
                      checked={invoice.template === 'modern'} 
                      onChange={handleInputChange} 
                    />
                    <label htmlFor="template-modern">モダン</label>
                  </div>
                  <button 
                    type="button" 
                    className="sample-preview-btn"
                    onClick={() => showSamplePreview('modern')}
                  >
                    サンプル確認
                  </button>
                </div>
              </div>
              
              <div className={`template-option ${invoice.template === 'japanese_traditional' ? 'selected' : ''}`}>
                <div className="template-preview" onClick={() => handleInputChange({target: {name: 'template', value: 'japanese_traditional'}})}>
                  <div className="template-thumbnail japanese-template">
                    <div className="thumbnail-header japanese">請求書</div>
                    <div className="thumbnail-content">
                      <div className="thumbnail-stamp"></div>
                      <div className="thumbnail-table-bordered"></div>
                    </div>
                  </div>
                </div>
                <div className="template-description">
                  <p>{templateDescriptions.japanese_traditional}</p>
                </div>
                <div className="template-actions">
                  <div className="template-name">
                    <input 
                      type="radio" 
                      id="template-japanese" 
                      name="template" 
                      value="japanese_traditional" 
                      checked={invoice.template === 'japanese_traditional'} 
                      onChange={handleInputChange} 
                    />
                    <label htmlFor="template-japanese">スタンダード</label>
                  </div>
                  <button 
                    type="button" 
                    className="sample-preview-btn"
                    onClick={() => showSamplePreview('japanese_traditional')}
                  >
                    サンプル確認
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* サンプルプレビューモーダル */}
          {samplePreview.show && (
            <div className="sample-preview-modal">
              <div className="sample-preview-content">
                <div className="sample-preview-header">
                  <h3>
                    {samplePreview.template === 'standard' && 'シンプルテンプレート'}
                    {samplePreview.template === 'modern' && 'モダンテンプレート'}
                    {samplePreview.template === 'japanese_traditional' && 'スタンダードテンプレート'}
                  </h3>
                  <button className="close-preview" onClick={closeSamplePreview}>×</button>
                </div>
                <div className="sample-preview-body">
                  <div dangerouslySetInnerHTML={{ 
                    __html: invoiceTemplates[samplePreview.template](sampleData) 
                  }} />
                </div>
              </div>
            </div>
          )}
          
          <h2>請求書情報</h2>
          <div className="form-row">
            <div className="form-group">
              <label>請求書番号 <span className="optional-label">任意</span></label>
              <input 
                type="text" 
                name="invoiceNumber" 
                value={invoice.invoiceNumber} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>発行日 <span className="optional-label">任意</span></label>
              <input 
                type="date" 
                name="issueDate" 
                value={invoice.issueDate} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>支払期限 <span className="optional-label">任意</span></label>
              <input 
                type="date" 
                name="dueDate" 
                value={invoice.dueDate} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>端数処理方法 <span className="optional-label">任意</span></label>
              <select
                name="roundingMethod"
                value={invoice.roundingMethod}
                onChange={handleInputChange}
              >
                <option value="floor">切り捨て</option>
                <option value="ceil">切り上げ</option>
                <option value="round">四捨五入</option>
              </select>
            </div>
          </div>
          
          <div className="section-header">
            <h2 onClick={() => toggleSection('companyInfo')}>
              請求元情報 {toggleState.companyInfo ? '▼' : '▶'}
            </h2>
          </div>
          {toggleState.companyInfo && (
            <div className="section-content">
              <div className="form-group">
                <label>会社名 <span className="required-label">必須</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={invoice.company.name} 
                  onChange={handleCompanyChange} 
                  required
                />
              </div>
              <div className="form-group">
                <label>郵便番号 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={invoice.company.postalCode} 
                  onChange={handleCompanyChange} 
                />
              </div>
              <div className="form-group">
                <label>住所 <span className="optional-label">任意</span></label>
                <textarea 
                  name="address" 
                  value={invoice.company.address} 
                  onChange={handleCompanyChange} 
                ></textarea>
              </div>
              <div className="form-group">
                <label>企業ロゴ <span className="optional-label">任意</span></label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="logo-upload"
                />
                {invoice.company.logo && (
                  <div className="logo-preview">
                    <img src={invoice.company.logo} alt="企業ロゴプレビュー" style={{maxHeight: "100px", maxWidth: "200px"}} />
                    <button 
                      type="button" 
                      className="remove-logo" 
                      onClick={() => setInvoice({...invoice, company: {...invoice.company, logo: ''}})}
                    >
                      ロゴを削除
                    </button>
                  </div>
                )}
              </div>
              {/* 印鑑画像アップロード欄の追加 */}
              {invoice.template === 'japanese_traditional' && (
                <div className="form-group">
                  <label>印鑑 <span className="optional-label">任意</span></label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleStampUpload} 
                    className="stamp-upload"
                  />
                  {invoice.company.stampImage && (
                    <div className="stamp-preview">
                      <img src={invoice.company.stampImage} alt="印鑑プレビュー" style={{maxHeight: "80px", maxWidth: "80px"}} />
                      <button 
                        type="button" 
                        className="remove-stamp" 
                        onClick={() => setInvoice({...invoice, company: {...invoice.company, stampImage: ''}})}
                      >
                        印鑑を削除
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* 登録印欄の設定を印鑑の下に移動 */}
              {invoice.template === 'japanese_traditional' && (
                <div className="form-group">
                  <label>登録印欄 <span className="optional-label">任意</span></label>
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="hasStamp"
                      checked={invoice.templateSpecific.japanese_traditional.hasStamp}
                      onChange={(e) => {
                        setInvoice({
                          ...invoice,
                          templateSpecific: {
                            ...invoice.templateSpecific,
                            japanese_traditional: {
                              ...invoice.templateSpecific.japanese_traditional,
                              hasStamp: e.target.checked
                            }
                          }
                        });
                      }}
                    />
                    <label htmlFor="hasStamp">登録印欄を表示する</label>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>電話番号 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="phone" 
                  value={invoice.company.phone} 
                  onChange={handleCompanyChange} 
                />
              </div>
              <div className="form-group">
                <label>メール <span className="optional-label">任意</span></label>
                <input 
                  type="email" 
                  name="email" 
                  value={invoice.company.email} 
                  onChange={handleCompanyChange} 
                />
              </div>
            </div>
          )}
          
          <div className="section-header">
            <h2 onClick={() => toggleSection('clientInfo')}>
              請求先情報 {toggleState.clientInfo ? '▼' : '▶'}
            </h2>
          </div>
          {toggleState.clientInfo && (
            <div className="section-content">
              <div className="form-group">
                <label>会社名/個人名 <span className="required-label">必須</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={invoice.client.name} 
                  onChange={handleClientChange} 
                  required
                />
              </div>
              <div className="form-group">
                <label>郵便番号 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={invoice.client.postalCode} 
                  onChange={handleClientChange} 
                />
              </div>
              <div className="form-group">
                <label>住所 <span className="optional-label">任意</span></label>
                <textarea 
                  name="address" 
                  value={invoice.client.address} 
                  onChange={handleClientChange} 
                ></textarea>
              </div>
              
              {/* 伝統的なテンプレート用の追加フィールド */}
              {shouldShowField('clientDepartment') && (
                <div className="form-group">
                  <label>部署名 <span className="optional-label">任意</span></label>
                  <input 
                    type="text" 
                    name="departmentName" 
                    value={invoice.client.departmentName} 
                    onChange={handleClientChange} 
                  />
                </div>
              )}
              
              {shouldShowField('clientContact') && (
                <div className="form-group">
                  <label>担当者名 <span className="optional-label">任意</span></label>
                  <input 
                    type="text" 
                    name="contactPerson" 
                    value={invoice.client.contactPerson} 
                    onChange={handleClientChange} 
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="section-header">
            <h2 onClick={() => toggleSection('bankInfo')}>
              銀行振込先情報 {toggleState.bankInfo ? '▼' : '▶'}
            </h2>
          </div>
          {toggleState.bankInfo && (
            <div className="section-content">
              <div className="form-group">
                <label>銀行名 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={invoice.bankInfo.bankName} 
                  onChange={handleBankInfoChange} 
                />
              </div>
              <div className="form-group">
                <label>支店名 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="branchName" 
                  value={invoice.bankInfo.branchName} 
                  onChange={handleBankInfoChange} 
                />
              </div>
              <div className="form-group">
                <label>口座種類 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="accountType" 
                  value={invoice.bankInfo.accountType} 
                  onChange={handleBankInfoChange} 
                />
              </div>
              <div className="form-group">
                <label>口座番号 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="accountNumber" 
                  value={invoice.bankInfo.accountNumber} 
                  onChange={handleBankInfoChange} 
                />
              </div>
              <div className="form-group">
                <label>口座名義 <span className="optional-label">任意</span></label>
                <input 
                  type="text" 
                  name="accountName" 
                  value={invoice.bankInfo.accountName} 
                  onChange={handleBankInfoChange} 
                />
              </div>
            </div>
          )}
          
          <div className="section-header">
            <h2 onClick={() => toggleSection('itemsInfo')}>
              品目 {toggleState.itemsInfo ? '▼' : '▶'}
            </h2>
          </div>
          {toggleState.itemsInfo && (
            <div className="section-content">
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
                    <label>品目 <span className="required-label">必須</span></label>
                    <input 
                      type="text" 
                      name="description" 
                      value={item.description} 
                      onChange={(e) => handleItemChange(index, e)} 
                      required
                    />
                  </div>
                  <div className="form-group quantity">
                    <label>数量 <span className="required-label">必須</span></label>
                    <input 
                      type="number" 
                      name="quantity" 
                      value={item.quantity} 
                      onChange={(e) => handleItemChange(index, e)} 
                      required
                    />
                  </div>
                  <div className="form-group unit-price">
                    <label>単価 <span className="required-label">必須</span></label>
                    <input 
                      type="number" 
                      name="unitPrice" 
                      value={item.unitPrice} 
                      onChange={(e) => handleItemChange(index, e)} 
                      required
                    />
                  </div>
                  <div className="form-group tax-rate">
                    <label>税率 <span className="required-label">必須</span></label>
                    <select
                      name="taxRate"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(index, e)}
                      required
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
                  <div className="form-group remarks">
                    <label>備考</label>
                    <textarea 
                      name="remarks" 
                      value={item.remarks} 
                      onChange={(e) => handleItemChange(index, e)} 
                    ></textarea>
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
            </div>
          )}
          
          <div className="form-group">
            <label>備考 <span className="optional-label">任意</span></label>
            <textarea 
              name="notes" 
              value={invoice.notes} 
              onChange={handleInputChange} 
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>メール送信先 <span className="optional-label">任意</span></label>
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
      <div className="footer-notice">
        <p>※ このツールで入力された情報はサーバーに一切保存されません。</p>
        <p>※ ソースコードは <a href="https://github.com/akira1110/invoice-web2" target="_blank" rel="noopener noreferrer">GitHub</a> で公開しています。</p>
        <p>※ 税率ごと（8%・10%）に合計金額を算出後、端数処理を適用します。</p>
      </div>
    </div>
  );
}

export default App;
