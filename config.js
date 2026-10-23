// App settings. Edit, commit, and GitHub Pages picks them up.
window.YARD_CONFIG = {
  // The "Landscaping Map" Google Sheet. The app reads it live when the sheet
  // is shared as "Anyone with the link: Viewer". If that fails, it falls back
  // to the CSV snapshots in data/.
  sheetId: "1jKFUS5u0UUiVP_8_vDzcAWvBMYi86t_qKfSfmnYUPSs",

  // One entry per sheet tab. `tab` must match the tab name exactly.
  yards: [
    {
      key: "back",
      label: "Backyard + South",
      tab: "Backyard + South",
      snapshot: "data/backyard.csv",
      map: "", // images/backyard-map.jpg once Drew OKs publishing the aerial photo
    },
    {
      key: "front",
      label: "Front yard",
      tab: "Frontyard",
      snapshot: "data/frontyard.csv",
      map: "", // add images/frontyard-map.jpg when there is one
    },
  ],
};
