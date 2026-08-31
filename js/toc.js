(function() {
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function() {
        var post = document.querySelector('.post-md');
        if (!post) {
            return;
        }

        // strong 的父 p 是否位于列表项(li)内
        function insideLi(node) {
            while (node && node !== post) {
                if (node.tagName === 'LI') {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        }

        var candidates = [];
        var seenNodes = [];

        function pushCandidate(node, level) {
            if (!node || node.textContent.trim() === '') {
                return;
            }
            if (seenNodes.indexOf(node) !== -1) {
                return;
            }
            seenNodes.push(node);
            candidates.push({ node: node, level: level });
        }

        var i;

        // 章节标题：strong 在 p 内，且 p 不在 li 内（如 **一、**）→ 一级
        // 有答案的题目：strong 在 li > p 内（如 1. **液体制剂:** 是指...）→ 二级
        var inP = post.querySelectorAll('p > strong');
        for (i = 0; i < inP.length; i++) {
            var s1 = inP[i];
            var level = insideLi(s1.parentNode) ? 2 : 1;
            pushCandidate(s1, level);
        }

        // 没填答案的题目：strong 是 li 的直接子元素（如 1. **pharmacopoeia:**）→ 二级
        var inLi = post.querySelectorAll('li > strong');
        for (i = 0; i < inLi.length; i++) {
            var s2 = inLi[i];
            pushCandidate(s2, 2);
        }

        // 无任何目录项时不显示左侧目录（CSS 默认已隐藏，无需处理）
        if (candidates.length === 0) {
            return;
        }

        // 按文档顺序排序
        candidates.sort(function(a, b) {
            var rel = a.node.compareDocumentPosition(b.node);
            if (rel & 2) {
                return 1;
            }
            return -1;
        });

        // 为标题补唯一 id，避免中文锚点冲突
        for (var m = 0; m < candidates.length; m++) {
            var el = candidates[m].node;
            if (!el.id || el.id.trim() === '') {
                el.id = 'toc-item-' + m;
            }
        }

        // 按层级构建嵌套目录
        var root = document.createElement('ul');
        root.className = 'nav nav-list';
        var stack = []; // { level, ul }

        for (var n = 0; n < candidates.length; n++) {
            var item = candidates[n];
            var li = document.createElement('li');
            li.className = 'tocify-item';
            var a = document.createElement('a');
            a.className = 'nav-link';
            a.setAttribute('href', '#' + item.node.id);
            a.textContent = item.node.textContent.trim();
            li.appendChild(a);

            while (stack.length && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }
            var parentList = stack.length ? stack[stack.length - 1].ul : root;
            parentList.appendChild(li);

            var sub = document.createElement('ul');
            sub.className = 'nav nav-list tocify-subheader';
            li.appendChild(sub);
            stack.push({ level: item.level, ul: sub });
        }

        // 移除空的子列表
        var emptyUls = root.querySelectorAll('ul');
        for (var q = 0; q < emptyUls.length; q++) {
            if (emptyUls[q].children.length === 0) {
                emptyUls[q].parentNode.removeChild(emptyUls[q]);
            }
        }

        var toc = document.getElementById('toc');
        if (!toc) {
            return;
        }
        toc.innerHTML = '';
        toc.appendChild(root);

        // 有目录项，显示左侧目录（宽屏下；窄屏仍由 CSS 媒体查询强制隐藏）
        var tocContainer = document.querySelector('.left-toc-container');
        if (tocContainer) {
            tocContainer.style.display = 'block';
        }

        // 点击目录平滑滚动到对应标题
        toc.addEventListener('click', function(e) {
            var target = e.target;
            if (target && target.tagName === 'A' && target.className.indexOf('nav-link') !== -1) {
                var h = document.querySelector(target.getAttribute('href'));
                if (h) {
                    e.preventDefault();
                    var top = h.getBoundingClientRect().top + window.pageYOffset - 90;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            }
        });

        // 滚动时高亮当前章节
        var items = toc.querySelectorAll('li.tocify-item');
        function highlightCurrent() {
            var scrollTop = window.pageYOffset + 120;
            var current = null;
            for (var k = 0; k < items.length; k++) {
                var link = items[k].querySelector('a');
                if (!link) {
                    continue;
                }
                var h = document.querySelector(link.getAttribute('href'));
                if (h && h.getBoundingClientRect().top + window.pageYOffset <= scrollTop) {
                    current = items[k];
                }
            }
            for (var r = 0; r < items.length; r++) {
                items[r].className = items[r].className.replace(/\bactive\b/g, '').trim();
            }
            if (current) {
                current.className += ' active';
            }
        }

        window.addEventListener('scroll', highlightCurrent);
        highlightCurrent();
    });
})();
