/**
 * 虚拟滚动列表模块
 * 定高虚拟滚动 + 缓冲窗口，适配 MelodyBox 播放列表
 */
(function () {
  'use strict';

  // 核心参数（必须与 CSS 中 .pl-item 的实际高度匹配）
  const DEFAULT_ITEM_HEIGHT = 88;
  const BUFFER = 6;

  function createVirtualList(scroller, wrapper, phantom, renderItem, options) {
    const opts = options || {};
    let itemHeight = opts.itemHeight || DEFAULT_ITEM_HEIGHT;
    let items = [];
    const mounted = new Map();
    let rafPending = false;
    let firstPaint = true;

    function totalHeight() {
      return items.length * itemHeight;
    }

    function visibleRange() {
      const scrollTop = scroller.scrollTop;
      const viewH = scroller.clientHeight;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER);
      const end = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + viewH) / itemHeight) + BUFFER
      );
      return { start, end };
    }

    function mountItem(index) {
      if (mounted.has(index)) return mounted.get(index);
      
      const el = renderItem(items[index], index);
      el.style.position = 'absolute';
      el.style.top = (index * itemHeight) + 'px';
      el.style.left = '0';
      el.style.right = '0';
      el.style.boxSizing = 'border-box';
      el.dataset.vIndex = String(index);

      if (firstPaint && index < 10) {
        el.classList.add('pl-animate');
        el.style.setProperty('--i', index);
      }

      wrapper.appendChild(el);
      
      // 动态校准高度：防止 CSS 设置的 padding 撑破固定高度
      // 只有在第一次渲染时，稍微修正一下 itemHeight 以适配真实环境
      if (firstPaint && index === 0) {
        requestAnimationFrame(() => {
          const realHeight = el.offsetHeight;
          if (realHeight > 0 && Math.abs(realHeight - itemHeight) > 2) {
             console.warn(`[VirtualList] 发现高度不匹配，自动修正为 ${realHeight}px`);
             itemHeight = realHeight;
             phantom.style.height = totalHeight() + 'px';
             // 重新对齐所有项
             for (const [idx, node] of mounted) {
               node.style.top = (idx * itemHeight) + 'px';
             }
          }
        });
      }

      mounted.set(index, el);
      return el;
    }

    function unmountItem(index) {
      const el = mounted.get(index);
      if (!el) return;
      el.remove();
      mounted.delete(index);
    }

    function reconcile() {
      const { start, end } = visibleRange();
      // 卸载窗口外的
      for (const idx of Array.from(mounted.keys())) {
        if (idx < start || idx > end) unmountItem(idx);
      }
      // 挂载窗口内的
      for (let i = start; i <= end; i++) mountItem(i);
    }

    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        reconcile();
      });
    }

    function setData(newItems, keepScroll) {
      items = newItems || [];
      phantom.style.height = totalHeight() + 'px';
      wrapper.innerHTML = '';
      mounted.clear();

      if (!keepScroll) scroller.scrollTop = 0;
      reconcile();

      firstPaint = false;
      setTimeout(() => { firstPaint = true; }, 600);
    }

    function refresh() {
      wrapper.innerHTML = '';
      mounted.clear();
      reconcile();
    }

    function scrollToIndex(index) {
      const target = Math.max(
        0,
        index * itemHeight - scroller.clientHeight / 2 + itemHeight / 2
      );
      scroller.scrollTo({ top: target, behavior: 'smooth' });
    }

    function flashIndex(index) {
      scrollToIndex(index);
      setTimeout(() => {
        const el = mounted.get(index);
        if (!el) return;
        el.classList.remove('locate-flash');
        void el.offsetWidth;
        el.classList.add('locate-flash');
        clearTimeout(el._flashTimer);
        el._flashTimer = setTimeout(() => el.classList.remove('locate-flash'), 1600);
      }, 320);
    }

    function updateItemHeight(h) {
      if (h && h > 0 && h !== itemHeight) {
        itemHeight = h;
        phantom.style.height = totalHeight() + 'px';
        refresh();
      }
    }

    function getMountedEl(index) {
      return mounted.get(index) || null;
    }

    scroller.addEventListener('scroll', onScroll, { passive: true });

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        phantom.style.height = totalHeight() + 'px';
        reconcile();
      });
      ro.observe(scroller);
    }

    return {
      setData,
      refresh,
      scrollToIndex,
      flashIndex,
      getMountedEl,
      updateItemHeight,
      get items() { return items; },
      get mountedMap() { return mounted; },
      get itemHeight() { return itemHeight; },
      destroy() {
        scroller.removeEventListener('scroll', onScroll);
        if (ro) ro.disconnect();
        wrapper.innerHTML = '';
        mounted.clear();
      }
    };
  }

  window.PlaylistVirtual = { createVirtualList, DEFAULT_ITEM_HEIGHT };
})();