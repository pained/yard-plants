// App settings. Edit, commit, and GitHub Pages picks them up.
window.YARD_CONFIG = {
  // The "Landscaping Map" Google Sheet. The app reads it live when the sheet
  // is shared as "Anyone with the link: Viewer". If that fails, it falls back
  // to the CSV snapshots in data/.
  sheetId: "1jKFUS5u0UUiVP_8_vDzcAWvBMYi86t_qKfSfmnYUPSs",

  // One entry per sheet tab. `tab` must match the tab name exactly. `gid` is
  // the number after "#gid=" in the sheet's URL when that tab is open.
  yards: [
    {
      key: "back",
      label: "Backyard + South",
      tab: "Backyard + South",
      gid: 0,
      snapshot: "data/backyard.csv",
      map: "", // the aerial photo stays private, so no map image here
    },
    {
      key: "front",
      label: "Front yard",
      tab: "Frontyard",
      gid: 1195815776,
      snapshot: "data/frontyard.csv",
      map: "", // add images/frontyard-map.jpg when there is one
    },
  ],
};
