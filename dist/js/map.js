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

   const projects = await fetch('./files/projects.json')
      .then(response => response.json());

   await ymaps.ready();

   const popup = document.querySelector('.geo__popup');
   const popupTitle = document.querySelector('.geo__popup-title');
   const popupCategory = document.querySelector('.geo__popup-category');
   const popupGallery = document.querySelector('.geo__popup-gallery');
   const popupButton = document.querySelector('.geo__popup-button');

   function openPopup(project) {

      popupTitle.textContent = project.title;

      popupCategory.textContent =
         `Отрасль: ${project.industry}`;

      popupButton.href = project.link;

      popupGallery.innerHTML = '';

      project.images.forEach((src, index) => {

         popupGallery.insertAdjacentHTML(
            'beforeend',
            `
         <a href="${src}"
            class="geo__popup-image geo-lightbox"
            data-gallery="project-${project.id || project.title}">
            <img src="${src}" alt="" loading="lazy">
         </a>
         `
         );

      });

      popupLightbox?.destroy();

      popupLightbox = window.GLightbox({
         selector: '.geo-lightbox'
      });

      popup.classList.add('show');
   }

   const map = new ymaps.Map('map', {
      center: [61, 90],
      zoom: 3,
      controls: ['zoomControl']
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
            8,
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

   map.events.add('click', () => {
      popup.classList.remove('show');
   });

   const filterButtons = document.querySelectorAll('.geo__filter');

   filterButtons.forEach(button => {

      button.addEventListener('click', () => {

         filterButtons.forEach(btn => {
            btn.classList.remove('active');
         });

         button.classList.add('active');

         const category = button.dataset.category;

         placemarks.forEach(item => {

            map.geoObjects.remove(item.placemark);

            if (
               category === 'all' ||
               item.category === category
            ) {
               map.geoObjects.add(item.placemark);
            }

         });

         popup.classList.remove('show');

         const visiblePlacemarks = placemarks.filter(item =>
            category === 'all'
               ? true
               : item.category === category
         );

         if (visiblePlacemarks.length) {

            const bounds = ymaps.geoQuery(
               visiblePlacemarks.map(item => item.placemark)
            ).getBounds();

            map.setBounds(bounds, {
               checkZoomRange: true,
               zoomMargin: 80,
               duration: 500
            });

         }

      });

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
