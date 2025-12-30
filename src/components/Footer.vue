<template>
  <footer class="app-footer">
    <div class="counter-container">
        <nobr>
            <table border="0" cellspacing="0" cellpadding="0">
                <tbody>
                    <tr>
                        <td>
                            <a href="https://ctr.stylemap.co.jp/">
                                <img src="https://www.f-counter.net/ani1/66/1767080338/" alt="無料アクセスカウンター" border="0" style="margin:0px; padding:0px; border:0px; vertical-align:bottom">
                            </a>
                        </td>
                        <td>
                            <a href="https://ctr.stylemap.co.jp/">
                                <img src="https://www.f-counter.net/ani2/66/1767080338/" alt="無料アクセスカウンター" border="0" style="margin:0px; padding:0px; border:0px; vertical-align:bottom">
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </nobr>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none; /* Allow clicks to pass through the empty areas */
  padding: 5px; /* Spacing from the exact edge */
}

.counter-container {
  pointer-events: auto; /* Re-enable clicks for the counter itself */
}
</style>
