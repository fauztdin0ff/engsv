/*==========================================================================
Popups
============================================================================*/
function closePopup(popup) {
   if (!popup) return;
   popup.classList.remove('show');
   const openedPopup = document.querySelector('.popup.show');

   if (!openedPopup) {
      document.body.style.overflow = '';
   }
}


function initPopups() {

   document.addEventListener('click', (e) => {
      const openButton = e.target.closest('.open-popup');

      if (openButton) {
         const popupId = openButton.dataset.popup;
         const popup = document.getElementById(popupId);
         if (!popup) return;

         const formBlock = openButton.dataset.formBlock;
         const blockInput = popup.querySelector('input[name="block"]');

         if (blockInput) {
            blockInput.value = formBlock || '';
         }

         popup.classList.add('show');
         document.body.style.overflow = 'hidden';
         return;
      }


      const closeButton = e.target.closest('.popup__close');

      if (closeButton) {
         const popup = closeButton.closest('.popup');
         if (!popup) return;
         closePopup(popup);
         return;
      }

      const popup = e.target.closest('.popup');
      if (
         popup &&
         !e.target.closest('.popup__body')
      ) {
         closePopup(popup);
      }

      const resetButton = e.target.closest('.reset-button');
      if (!resetButton) return;

      const thanksPopup = resetButton.closest('.popup');
      if (!thanksPopup) return;

      document.querySelectorAll('form').forEach(form => {
         form.reset();
         form.querySelectorAll('.field').forEach(field => {
            field.classList.remove('is-focus', 'warning');
            field.querySelector('.warning-image')?.remove();
         });

         const wrapper = form.closest('.form-wrapper');
         wrapper?.classList.remove('sending');
      });

      closePopup(thanksPopup);

   });

}

/*---------------------------------------------------------------------------
Маска телефона
---------------------------------------------------------------------------*/
function phoneMask() {
   document.querySelectorAll('input[name="phone"]').forEach((input) => {
      let keyCode;
      function mask(event) {
         event.keyCode && (keyCode = event.keyCode);
         let pos = this.selectionStart;
         if (pos < 3) event.preventDefault();
         let matrix = "+7 (___) ___ __ __",
            i = 0,
            val = this.value.replace(/\D/g, ""),
            new_value = matrix.replace(/[_\d]/g, (a) =>
               i < val.length ? val.charAt(i++) : a
            );
         i = new_value.indexOf("_");
         if (i !== -1) {
            i < 5 && (i = 3);
            new_value = new_value.slice(0, i);
         }
         let reg = matrix
            .substr(0, this.value.length)
            .replace(/_+/g, (a) => `\\d{1,${a.length}}`)
            .replace(/[+()]/g, "\\$&");
         reg = new RegExp("^" + reg + "$");
         if (!reg.test(this.value) || this.value.length < 5 || (keyCode > 47 && keyCode < 58)) {
            this.value = new_value;
         }
         if (event.type === "blur" && this.value.length < 5) this.value = "";
      }

      input.addEventListener("input", mask);
      input.addEventListener("focus", mask);
      input.addEventListener("blur", mask);
      input.addEventListener("keydown", mask);
   });
}


/*==========================================================================
Input focus
============================================================================*/
function initFields() {

   function setFieldState(input) {
      const field = input.closest('.field');
      if (!field) return;

      if (input.value.trim() !== '') {
         field.classList.add('is-focus');
      }
   }

   document.addEventListener('focusin', (e) => {
      const input = e.target.closest('input, textarea');
      if (!input) return;

      const field = input.closest('.field');
      if (!field) return;

      field.classList.add('is-focus');
      field.classList.remove('warning');
      field.querySelector('.warning-image')?.remove();

      requestAnimationFrame(() => {
         setFieldState(input);
      });
   });

   document.addEventListener('focusout', (e) => {
      const input = e.target.closest('input, textarea');
      if (!input) return;

      const field = input.closest('.field');
      if (!field) return;

      if (input.value.trim() === '') {
         field.classList.remove('is-focus');
      }
   });

   document.addEventListener('input', (e) => {
      const input = e.target.closest('input, textarea');
      if (!input) return;

      setFieldState(input);
   });

   document
      .querySelectorAll('.field input, .field textarea')
      .forEach(setFieldState);
}


/*==========================================================================
Validate fields
============================================================================*/
function validateForm(form) {
   let isValid = true;
   const fields = form.querySelectorAll('.field.required');

   fields.forEach(field => {
      const input = getFieldInput(field);
      if (!input) return;

      let warningImage = field.querySelector('.warning-image');
      if (!input.value.trim()) {

         field.classList.add('warning');
         isValid = false;

         if (!warningImage) {
            warningImage = document.createElement('img');
            warningImage.src = 'img/warning-1.svg';
            warningImage.className = 'warning-image';
            warningImage.alt = '';
            field.appendChild(warningImage);
         }

      } else {
         field.classList.remove('warning');
         warningImage?.remove();
      }
   });

   return isValid;
}


function getFieldInput(field) {
   return [...field.querySelectorAll('input, textarea')]
      .find(input => getComputedStyle(input).display !== 'none');
}


/*==========================================================================
Отправка формы
============================================================================*/

async function sendForm(form) {
   const formData = new FormData(form);

   try {
      const response = await fetch(form.action || 'send.php', {
         method: 'POST',
         body: formData
      });

      if (!response.ok) {
         throw new Error(`Error ${response.status}. Не удалось отправить форму. Попробуйте ещё раз.`);
      }
      return true;
   } catch (error) {
      alert(error.message);
      return false;
   }
}


/*==========================================================================
Обработка отправки формы
============================================================================*/
function initForms() {

   document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (!form.matches('form')) return;
      e.preventDefault();

      const submitButton = form.querySelector('[type="submit"]');
      const wrapper = form.closest('.form-wrapper');
      submitButton?.classList.add('disabled');

      if (!validateForm(form)) {
         submitButton?.classList.remove('disabled');
         return;
      }

      wrapper?.classList.add('sending');

      const timer = new Promise(resolve => {
         setTimeout(resolve, 1000);
      });

      const request = sendForm(form);
      const [, success] = await Promise.all([
         timer,
         request
      ]);

      wrapper?.classList.remove('sending');

      if (success) {

         const currentPopup = form.closest('.popup');

         form.reset();

         form.querySelectorAll('.field').forEach(field => {
            field.classList.remove('is-focus', 'warning');
            field.querySelector('.warning-image')?.remove();
         });

         if (currentPopup) {
            closePopup(currentPopup);
         }

         const thanksPopup = document.getElementById('thanks-popup');

         if (thanksPopup) {
            thanksPopup.classList.add('show');
            document.body.style.overflow = 'hidden';
         }

      }

      submitButton?.classList.remove('disabled');
   });
}



/*==========================================================================
initForms
============================================================================*/
document.addEventListener("DOMContentLoaded", () => {
   initPopups();
   phoneMask();
   initFields();
   initForms();
})