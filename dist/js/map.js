let popupLightbox = null;

/*==========================================================================
Map script
============================================================================*/
function loadYandexMaps() {
   return new Promise((resolve, reject) => {

      if (window.ymaps) {
         resolve();
         return;
      }

      const script = document.createElement('script');

      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
      script.async = true;

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);

   });
}

/*==========================================================================
Observer
============================================================================*/
const geoSection = document.querySelector('.geo');

let mapInitialized = false;

const observer = new IntersectionObserver(async ([entry]) => {

   if (!entry.isIntersecting || mapInitialized) return;

   mapInitialized = true;

   await loadYandexMaps();

   initMap();

   observer.disconnect();

}, {
   rootMargin: '500px'
});

if (geoSection) {
   observer.observe(geoSection);
}

/*==========================================================================
Map
============================================================================*/
async function initMap() {

   const lang = document.documentElement.lang.toLowerCase();

   const i18n = {
      ru: {
         industry: 'Отрасль'
      },
      en: {
         industry: 'Industry'
      }
   };

   const t = i18n[lang] || i18n.en;

   const projects = await fetch(`./files/projects-${lang}.json`)
      .then(response => response.json())
      .catch(() => fetch('./files/projects-en.json').then(res => res.json()));
   await ymaps.ready();

   const popup = document.querySelector('.geo__popup');
   const popupTitle = document.querySelector('.geo__popup-title');
   const popupCategory = document.querySelector('.geo__popup-category');
   const popupGallery = document.querySelector('.geo__popup-gallery');
   const popupButton = document.querySelector('.geo__popup-button');
   const popupClose = document.querySelector('.geo__popup-close');


   function openPopup(project) {

      popupTitle.textContent = project.title;
      popupCategory.textContent = `${t.industry}: ${project.category}`;


      popupGallery.innerHTML = '';

      if (project.image) {
         popupGallery.innerHTML = `
            <div class="geo__popup-image">
               <img src="${project.image}" alt="${project.title}" loading="lazy">
            </div>
         `;
      }

      popup.classList.add('show');
   }

   function closePopup() {
      popup.classList.remove('show');

      const bounds = ymaps.geoQuery(
         placemarks.map(item => item.placemark)
      ).getBounds();

      map.setBounds(bounds, {
         checkZoomRange: true,
         zoomMargin: 80,
         duration: 500
      });
   }

   const map = new ymaps.Map('map', {
      center: [61, 90],
      zoom: 3,
      controls: ['zoomControl']
   }, {
      minZoom: 3,
      maxZoom: 18
   });

   map.behaviors.disable('scrollZoom');

   const placemarks = [];

   projects.forEach(project => {

      const placemark = new ymaps.Placemark(
         project.coords,
         {},
         {
            iconLayout: 'default#image',
            iconImageHref: './img/icons/map-marker.svg',
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -20]
         }
      );

      placemark.events.add('click', () => {

         openPopup(project);

         map.setCenter(
            project.coords,
            6,
            {
               duration: 500
            }
         );

      });

      map.geoObjects.add(placemark);

      placemarks.push({
         category: project.category,
         placemark,
         project
      });

   });

   console.table(
      placemarks.map(item => ({
         title: item.project.title,
         category: item.category,
         coords: item.project.coords
      }))
   );

   map.events.add('click', closePopup);

   popupClose.addEventListener('click', e => {
      e.stopPropagation();
      closePopup();
   });


   const bounds = ymaps.geoQuery(
      placemarks.map(item => item.placemark)
   ).getBounds();

   map.setBounds(bounds, {
      checkZoomRange: true,
      zoomMargin: 80
   });

   map.events.once('boundschange', () => {

      const groundPane = document.querySelector('.ymaps-2-1-79-ground-pane');

      if (groundPane) {
         groundPane.style.filter = 'grayscale(80%)';
      }

   });

}