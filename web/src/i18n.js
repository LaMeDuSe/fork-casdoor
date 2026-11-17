// Copyright 2021 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import i18n from "i18next";
import * as Conf from "./Conf";
import {initReactI18next} from "react-i18next";
import en from "./locales/en/data.json";

const resourcesToBackend = (res) => ({
  type: "backend",
  init(services, backendOptions, i18nextOptions) {/* use services and options */},
  read(language, namespace, callback) {
    if (typeof res === "function") {
      if (res.length < 3) {
        try {
          const r = res(language, namespace);
          if (r && typeof r.then === "function") {
            r.then((data) => callback(null, (data && data.default) || data)).catch(callback);
          } else {
            callback(null, r);
          }
        } catch (err) {
          callback(err);
        }
        return;
      }
      res(language, namespace, callback);
      return;
    }
    callback(null, res && res[language] && res[language][namespace]);
  },
});

// Languages that have a translation file in ./locales
export const SupportedLanguages = ["en", "zh", "es", "fr", "de", "ja", "pt", "pl", "tr", "uk", "vi"];

export function isSupportedLanguage(language) {
  return SupportedLanguages.includes(language);
}

// Returns the first supported language among the browser's preferred languages (e.g. "fr-FR" -> "fr")
export function getBrowserLanguage() {
  const browserLanguages = (navigator.languages && navigator.languages.length > 0) ? navigator.languages : [navigator.language];
  for (const browserLanguage of browserLanguages) {
    if (!browserLanguage) {
      continue;
    }
    const language = browserLanguage.toLowerCase().split(/[-_]/)[0];
    if (isSupportedLanguage(language)) {
      return language;
    }
  }
  return Conf.DefaultLanguage;
}

function initLanguage() {
  // A language explicitly chosen by the user (language selector, ?language= param) wins
  const savedLanguage = localStorage.getItem("language");
  if (isSupportedLanguage(savedLanguage)) {
    return savedLanguage;
  }
  if (savedLanguage !== null) {
    localStorage.removeItem("language");
  }

  if (Conf.ForceLanguage !== "") {
    return Conf.ForceLanguage;
  }

  return getBrowserLanguage();
}

i18n.use(resourcesToBackend(async(language, namespace) => {
  const res = await import(`./locales/${language}/data.json`);
  return res.default[namespace];
}
))
  .use(initReactI18next)
  .init({
    lng: initLanguage(),
    ns: Object.keys(en),
    fallbackLng: "en",

    keySeparator: false,

    interpolation: {
      escapeValue: true,
    },
    // debug: true,
    saveMissing: true,
  });
export default i18n;
