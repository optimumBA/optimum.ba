(function () {
  if (window.location.hostname !== 'optimum.ba' || window.location.protocol !== 'https:') return;
  if (document.querySelector('script[data-optimum-analytics]')) return;
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
  window.plausible.init = window.plausible.init || function (options) {
    window.plausible.o = options || {};
  };
  window.plausible.init({
    transformRequest: function (payload) {
      // URLs in analytics contain only the public path, never query values.
      payload.u = window.location.origin + window.location.pathname;
      return payload;
    }
  });
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://plausible.io/js/pa-L9tGewdmu_Uy8MsVELS5p.js';
  script.dataset.optimumAnalytics = '';
  document.head.appendChild(script);
})();
