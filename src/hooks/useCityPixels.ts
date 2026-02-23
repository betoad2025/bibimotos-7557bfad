import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CityMarketing {
  facebook_pixel_id: string | null;
  google_ads_id: string | null;
  google_analytics_id: string | null;
  tiktok_pixel_id: string | null;
  taboola_pixel_id: string | null;
}

export function useCityPixels(cityId: string | undefined) {
  useEffect(() => {
    if (!cityId) return;

    const injectPixels = async () => {
      const { data } = await supabase
        .from("city_marketing" as any)
        .select("facebook_pixel_id, google_ads_id, google_analytics_id, tiktok_pixel_id, taboola_pixel_id")
        .eq("city_id", cityId)
        .maybeSingle();

      if (!data) return;
      const marketing = data as unknown as CityMarketing;

      // Facebook Pixel
      if (marketing.facebook_pixel_id) {
        const fbScript = document.createElement("script");
        fbScript.innerHTML = `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${marketing.facebook_pixel_id}');
          fbq('track','PageView');
        `;
        fbScript.setAttribute("data-city-pixel", "facebook");
        document.head.appendChild(fbScript);
      }

      // Google Ads / GA4
      if (marketing.google_ads_id || marketing.google_analytics_id) {
        const gtagId = marketing.google_ads_id || marketing.google_analytics_id;
        const gtagScript = document.createElement("script");
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
        gtagScript.setAttribute("data-city-pixel", "google");
        document.head.appendChild(gtagScript);

        const gtagInit = document.createElement("script");
        gtagInit.innerHTML = `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          ${marketing.google_ads_id ? `gtag('config','${marketing.google_ads_id}');` : ""}
          ${marketing.google_analytics_id ? `gtag('config','${marketing.google_analytics_id}');` : ""}
        `;
        gtagInit.setAttribute("data-city-pixel", "google-init");
        document.head.appendChild(gtagInit);
      }

      // TikTok Pixel
      if (marketing.tiktok_pixel_id) {
        const ttScript = document.createElement("script");
        ttScript.innerHTML = `
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
          ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";
          o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(o,a)};
          ttq.load('${marketing.tiktok_pixel_id}');
          ttq.page();
        }(window,document,'ttq');
        `;
        ttScript.setAttribute("data-city-pixel", "tiktok");
        document.head.appendChild(ttScript);
      }

      // Taboola Pixel
      if (marketing.taboola_pixel_id) {
        const tbScript = document.createElement("script");
        tbScript.innerHTML = `
          window._tfa=window._tfa||[];
          window._tfa.push({notify:'event',name:'page_view',id:${marketing.taboola_pixel_id}});
          !function(t,f,a,x){if(!document.getElementById(x)){
          t.async=1;t.src=a;t.id=x;f.parentNode.insertBefore(t,f);}}
          (document.createElement('script'),document.getElementsByTagName('script')[0],
          '//cdn.taboola.com/libtrc/unip/${marketing.taboola_pixel_id}/tfa.js','tb_tfa_script');
        `;
        tbScript.setAttribute("data-city-pixel", "taboola");
        document.head.appendChild(tbScript);
      }
    };

    injectPixels();

    // Cleanup on unmount
    return () => {
      document.querySelectorAll("[data-city-pixel]").forEach((el) => el.remove());
    };
  }, [cityId]);
}
