// Returns get parameters.
//
// If the desired param does not exist, null will be returned
//
// To get the document params:
// @example value = $(document).getUrlParam("paramName");
//
// To get the params of a html-attribut (uses src attribute)
// @example value = $('#imgLink').getUrlParam("paramName");
jQuery.fn.extend({
  getUrlParam(strParamName) {
    let qString, strHref, strQueryString;
    strParamName = escape(unescape(strParamName));

    if ($(this).attr("nodeName") === "#document") {
      if (window.location.search.search(strParamName) > -1) {
        qString = window.location.search.substr(1,window.location.search.length).split("&");
      }
    } else if ($(this).attr("src") !== "undefined") {
      strHref = $(this).attr("src");
      if (strHref.indexOf("?") > -1) {
        strQueryString = strHref.substr(strHref.indexOf("?") + 1);
        qString = strQueryString.split("&");
      }
    } else if ($(this).attr("href") !== "undefined") {
      strHref = $(this).attr("href");
      if (strHref.indexOf("?") > -1) {
        strQueryString = strHref.substr(strHref.indexOf("?") + 1);
        qString = strQueryString.split("&");
      }
    } else {
      return null;
    }

    if (!qString) { return null; }

    let returnVal = (Array.from(qString).filter((query) => escape(unescape(query.split("=")[0])) === strParamName).map((query) => query.split("=")[1]));

    if (returnVal.lenght === 0) {
      return null;
    } else if (returnVal.lenght === 1) {
      return returnVal[0];
    } else {
      return returnVal;
    }
  }
});
