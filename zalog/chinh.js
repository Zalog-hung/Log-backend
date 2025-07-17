console.log("🟢 chinh.js đã được load!") 

import { themDongMoi, xoaDong } from './bangexcel.js';
import { ganSuKienTheoCot } from './xulycot.js';

window.addEventListener('DOMContentLoaded', () => {
  ganSuKienTheoCot();

  document.getElementById('addnewrow').addEventListener('click', themDongMoi);

  document.querySelectorAll('.action-cell button').forEach(button => {
    if (button.textContent.includes('🗑️')) {
      button.addEventListener('click', function () {
        xoaDong(this);
      });
    }
  });
});
