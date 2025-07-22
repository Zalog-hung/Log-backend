// 📁 xulylayout.js
export class XuLyLayout {
  constructor() {
    this.currentTab = 'input';
    this.isMobile = false;
    this.isTablet = false;
    this.gridColumns = ['80px', '100px', '200px', '100px', '80px', '150px', '120px'];
    this.resizeObserver = null;
    this.init();
  }

  init() {
    this.detectDeviceType();
    this.setupTabSystem();
    this.setupResponsiveGrid();
    this.setupResizeObserver();
    this.setupLayoutEvents();
    if (window.ZaLogSystem) window.ZaLogSystem.xuLyLayout = this;
  }

  detectDeviceType() {
    const width = window.innerWidth;
    this.isMobile = width <= 768;
    this.isTablet = width > 768 && width <= 1024;
    
    document.body.classList.toggle('mobile', this.isMobile);
    document.body.classList.toggle('tablet', this.isTablet);
    document.body.classList.toggle('desktop', !this.isMobile && !this.isTablet);
  }

  setupTabSystem() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tabName = item.dataset.tab;
        this.switchTab(tabName);
      });
    });

    if (this.isMobile) {
      this.setupMobileTabSwipe();
    }
  }

  switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    document.querySelectorAll('.tab-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}Content`);
    });

    this.currentTab = tabName;
    this.adjustLayoutForTab(tabName);
    
    if (window.ZaLogSystem) {
      window.ZaLogSystem.state.currentTab = tabName;
    }
  }

  adjustLayoutForTab(tabName) {
    switch (tabName) {
      case 'input':
        this.optimizeInputLayout();
        break;
      case 'log':
        this.optimizeLogLayout();
        break;
      case 'analysis':
        this.optimizeAnalysisLayout();
        break;
      case 'config':
        this.optimizeConfigLayout();
        break;
    }
  }

  optimizeInputLayout() {
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    if (this.isMobile) {
      grid.style.gridTemplateColumns = 'repeat(7, minmax(60px, 1fr))';
      grid.style.fontSize = '10px';
    } else if (this.isTablet) {
      grid.style.gridTemplateColumns = 'repeat(7, minmax(80px, 1fr))';
      grid.style.fontSize = '11px';
    } else {
      grid.style.gridTemplateColumns = this.gridColumns.join(' ');
      grid.style.fontSize = '11px';
    }

    this.adjustToolbarLayout();
  }

  optimizeLogLayout() {
    const container = document.getElementById('logTableContainer');
    if (!container) return;

    if (this.isMobile) {
      container.style.maxHeight = '300px';
      container.style.fontSize = '9px';
    } else if (this.isTablet) {
      container.style.maxHeight = '400px';
      container.style.fontSize = '10px';
    } else {
      container.style.maxHeight = '500px';
      container.style.fontSize = '11px';
    }
  }

  optimizeAnalysisLayout() {
    const sourceGrid = document.querySelector('.source-grid');
    if (!sourceGrid) return;

    if (this.isMobile) {
      sourceGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (this.isTablet) {
      sourceGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else {
      sourceGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
  }

  optimizeConfigLayout() {
    const configItems = document.querySelectorAll('.config-item');
    configItems.forEach(item => {
      if (this.isMobile) {
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
      } else {
        item.style.flexDirection = 'row';
        item.style.alignItems = 'center';
      }
    });
  }

  adjustToolbarLayout() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    if (this.isMobile) {
      toolbar.style.flexDirection = 'column';
      toolbar.style.gap = '8px';
    } else {
      toolbar.style.flexDirection = 'row';
      toolbar.style.justifyContent = 'space-between';
    }
  }

  setupResponsiveGrid() {
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    this.makeGridScrollable(grid);
    this.adjustGridForDevice(grid);
  }

  makeGridScrollable(grid) {
    const container = document.createElement('div');
    container.className = 'excel-grid-container';
    container.style.cssText = `
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid #d4d4d4;
    `;

    grid.parentNode.insertBefore(container, grid);
    container.appendChild(grid);
  }

  adjustGridForDevice(grid) {
    if (this.isMobile) {
      grid.style.minWidth = '500px';
      this.adjustCellsForMobile();
    } else if (this.isTablet) {
      grid.style.minWidth = '700px';
      this.adjustCellsForTablet();
    }
  }

  adjustCellsForMobile() {
    const cells = document.querySelectorAll('.excel-cell');
    cells.forEach(cell => {
      cell.style.minHeight = '28px';
      cell.style.fontSize = '10px';
    });

    const inputs = document.querySelectorAll('.excel-cell input');
    inputs.forEach(input => {
      input.style.fontSize = '10px';
      input.style.padding = '2px';
    });
  }

  adjustCellsForTablet() {
    const cells = document.querySelectorAll('.excel-cell');
    cells.forEach(cell => {
      cell.style.minHeight = '24px';
      cell.style.fontSize = '11px';
    });
  }

  setupMobileTabSwipe() {
    let startX = 0;
    let startY = 0;
    let isTabSwipe = false;

    const tabContent = document.getElementById('tabContent');
    if (!tabContent) return;

    tabContent.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTabSwipe = false;
    }, { passive: true });

    tabContent.addEventListener('touchmove', (e) => {
      if (!isTabSwipe) {
        const deltaX = Math.abs(e.touches[0].clientX - startX);
        const deltaY = Math.abs(e.touches[0].clientY - startY);
        isTabSwipe = deltaX > deltaY && deltaX > 50;
      }
    }, { passive: true });

    tabContent.addEventListener('touchend', (e) => {
      if (!isTabSwipe) return;

      const deltaX = e.changedTouches[0].clientX - startX;
      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          this.switchToPreviousTab();
        } else {
          this.switchToNextTab();
        }
      }
    }, { passive: true });
  }

  switchToPreviousTab() {
    const tabs = ['input', 'log', 'analysis', 'config'];
    const currentIndex = tabs.indexOf(this.currentTab);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    this.switchTab(tabs[previousIndex]);
  }

  switchToNextTab() {
    const tabs = ['input', 'log', 'analysis', 'config'];
    const currentIndex = tabs.indexOf(this.currentTab);
    const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    this.switchTab(tabs[nextIndex]);
  }

  setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(entries => {
        this.handleResize();
      });
      this.resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 300);
    });
  }

  handleResize() {
    const oldIsMobile = this.isMobile;
    const oldIsTablet = this.isTablet;
    
    this.detectDeviceType();
    
    if (oldIsMobile !== this.isMobile || oldIsTablet !== this.isTablet) {
      this.adjustLayoutForTab(this.currentTab);
      this.repositionFloatingElements();
    }

    this.updateGridLayout();
  }

  updateGridLayout() {
    const grid = document.getElementById('gridElement');
    if (!grid) return;

    if (this.isMobile) {
      grid.style.gridTemplateColumns = 'repeat(7, minmax(50px, 1fr))';
    } else if (this.isTablet) {
      grid.style.gridTemplateColumns = 'repeat(7, minmax(70px, 1fr))';
    } else {
      grid.style.gridTemplateColumns = this.gridColumns.join(' ');
    }
  }

  repositionFloatingElements() {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }

    const notifications = document.querySelector('.notifications-container');
    if (notifications) {
      if (this.isMobile) {
        notifications.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          max-width: none;
        `;
      } else {
        notifications.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 300px;
        `;
      }
    }
  }

  setupLayoutEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const tabs = ['input', 'log', 'analysis', 'config'];
        const tabIndex = parseInt(e.key) - 1;
        this.switchTab(tabs[tabIndex]);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.switchToPreviousTab();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.switchToNextTab();
            break;
        }
      }
    });
  }

  adjustColumnWidth(columnIndex, width) {
    if (columnIndex >= 0 && columnIndex < this.gridColumns.length) {
      this.gridColumns[columnIndex] = `${width}px`;
      this.updateGridLayout();
    }
  }

  resetLayout() {
    this.gridColumns = ['80px', '100px', '200px', '100px', '80px', '150px', '120px'];
    this.updateGridLayout();
    this.adjustLayoutForTab(this.currentTab);
  }

  toggleFullscreen(element) {
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen?.() ||
      element.webkitRequestFullscreen?.() ||
      element.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
    }
  }

  optimizeForPrint() {
    const originalDisplay = document.body.style.display;
    
    document.body.classList.add('print-mode');
    
    const grid = document.getElementById('gridElement');
    if (grid) {
      grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
      grid.style.fontSize = '9px';
    }

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-mode');
      this.updateGridLayout();
    }, { once: true });
  }

  getLayoutInfo() {
    return {
      currentTab: this.currentTab,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      gridColumns: this.gridColumns
    };
  }

  applyLayoutPreset(preset) {
    switch (preset) {
      case 'compact':
        this.gridColumns = ['60px', '80px', '150px', '80px', '60px', '120px', '100px'];
        break;
      case 'wide':
        this.gridColumns = ['100px', '120px', '250px', '120px', '100px', '180px', '140px'];
        break;
      case 'mobile':
        this.gridColumns = ['50px', '70px', '120px', '70px', '50px', '100px', '80px'];
        break;
      default:
        this.resetLayout();
        return;
    }
    
    this.updateGridLayout();
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
  }
}

export const xuLyLayout = new XuLyLayout();

window.switchTab = (tabName) => xuLyLayout.switchTab(tabName);
window.resetLayout = () => xuLyLayout.resetLayout();

export default xuLyLayout;
