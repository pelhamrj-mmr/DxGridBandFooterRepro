// Read-only diagnostics for the repro page. Polls the grid's DOM and reports:
//  - footer gap: distance between the footer's bottom and the scroll viewer's bottom (0 = on the bottom edge)
//  - whether DevExpress has tagged the table with dxbl-grid-table-no-scroll
//  - the table's height vs. the scroll viewer's visible height
//  - how often that class flipped during the last second (a non-zero rate is the toggle loop)
// It never modifies the grid, so the bug reproduces the same way with or without this script.
(() => {
    const NO_SCROLL = 'dxbl-grid-table-no-scroll';
    const flipTimes = [];
    let observedTable = null;

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            const had = (m.oldValue || '').split(/\s+/).includes(NO_SCROLL);
            const has = m.target.classList.contains(NO_SCROLL);
            if (had !== has) flipTimes.push(performance.now());
        }
    });

    function update() {
        const out = document.getElementById('footer-diagnostics');
        const content = document.querySelector('.repro-grid .dxbl-scroll-viewer-content');
        const table = content && content.querySelector(':scope > .dxbl-grid-table');
        const footer = table && table.querySelector(':scope > tfoot');
        if (!out || !footer) return;

        if (table !== observedTable) {
            observer.disconnect();
            observer.observe(table, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
            observedTable = table;
        }

        const now = performance.now();
        while (flipTimes.length && now - flipTimes[0] > 1000) flipTimes.shift();

        const gap = Math.round(content.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom);
        const onBottomEdge = Math.abs(gap) <= 1;
        out.dataset.state = onBottomEdge && flipTimes.length === 0 ? 'ok' : 'bad';
        out.textContent =
            `footer gap: ${gap}px (${onBottomEdge ? 'on the bottom edge' : 'NOT on the bottom edge'})` +
            ` | ${NO_SCROLL}: ${table.classList.contains(NO_SCROLL) ? 'on' : 'off'}` +
            ` | table ${table.offsetHeight}px in a ${content.clientHeight}px viewport` +
            ` | class flips in the last second: ${flipTimes.length}`;
    }

    setInterval(update, 200);
})();
