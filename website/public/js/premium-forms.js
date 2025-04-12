/**
 * Premium Form Functionality
 * Enhanced form interactions, validation, and animations
 */

document.addEventListener('DOMContentLoaded', () => {
  initPremiumForms();
});

// Initialize premium form enhancements
function initPremiumForms() {
  // Find all forms to enhance
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Enhance form container
    const formContainer = form.closest('.admin3d-form-container, .form-container');
    if (formContainer) {
      formContainer.classList.add('premium-form-container');
    }
    
    // Enhance form groups
    const formGroups = form.querySelectorAll('.form-group, .input-group');
    formGroups.forEach(group => {
      group.classList.add('premium-form-group');
      
      // Enhance labels
      const labels = group.querySelectorAll('label');
      labels.forEach(label => {
        label.classList.add('premium-form-label');
        
        // Add required class if input is required
        const input = group.querySelector('input, select, textarea');
        if (input && input.required) {
          label.classList.add('required');
        }
      });
      
      // Enhance inputs
      const inputs = group.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="range"])');
      inputs.forEach(input => {
        input.classList.add('premium-form-input');
        setupInputValidation(input);
      });
      
      // Enhance selects
      const selects = group.querySelectorAll('select');
      selects.forEach(select => {
        select.classList.add('premium-form-select');
      });
      
      // Enhance textareas
      const textareas = group.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        textarea.classList.add('premium-form-textarea');
      });
      
      // Enhance checkboxes
      const checkboxes = group.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        const checkboxContainer = checkbox.closest('.checkbox, .form-check');
        if (checkboxContainer) {
          checkboxContainer.classList.add('premium-form-check');
          checkbox.classList.add('premium-form-check-input');
          
          const checkboxLabel = checkboxContainer.querySelector('label');
          if (checkboxLabel) {
            checkboxLabel.classList.add('premium-form-check-label');
          }
        }
      });
      
      // Enhance radios
      const radios = group.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        const radioContainer = radio.closest('.radio, .form-check');
        if (radioContainer) {
          radioContainer.classList.add('premium-form-check');
          radio.classList.add('premium-form-radio-input');
          
          const radioLabel = radioContainer.querySelector('label');
          if (radioLabel) {
            radioLabel.classList.add('premium-form-check-label');
          }
        }
      });
      
      // Enhance range inputs
      const ranges = group.querySelectorAll('input[type="range"]');
      ranges.forEach(range => {
        range.classList.add('premium-form-range');
        
        // Add value display if not exists
        if (!group.querySelector('.range-value, .form-range-value')) {
          const rangeValueContainer = document.createElement('div');
          rangeValueContainer.className = 'premium-form-range-value';
          
          const minValue = document.createElement('span');
          minValue.textContent = range.min || '0';
          
          const currentValue = document.createElement('span');
          currentValue.textContent = range.value;
          currentValue.className = 'current-value';
          
          const maxValue = document.createElement('span');
          maxValue.textContent = range.max || '100';
          
          rangeValueContainer.appendChild(minValue);
          rangeValueContainer.appendChild(currentValue);
          rangeValueContainer.appendChild(maxValue);
          
          group.appendChild(rangeValueContainer);
          
          // Update current value when range changes
          range.addEventListener('input', (e) => {
            currentValue.textContent = e.target.value;
          });
        }
      });
      
      // Enhance help text
      const helpTexts = group.querySelectorAll('.form-text, .help-text, .form-hint');
      helpTexts.forEach(helpText => {
        helpText.classList.add('premium-form-help-text');
      });
    });
    
    // Enhance form buttons
    const buttons = form.querySelectorAll('button, input[type="submit"]');
    buttons.forEach(button => {
      if (button.type === 'submit' || button.classList.contains('btn-primary')) {
        button.classList.add('premium-form-btn', 'premium-form-btn-primary');
      } else if (button.classList.contains('btn-danger')) {
        button.classList.add('premium-form-btn', 'premium-form-btn-danger');
      } else {
        button.classList.add('premium-form-btn', 'premium-form-btn-secondary');
      }
      
      // Wrap button text for loading state
      if (!button.querySelector('.btn-text')) {
        const buttonText = button.textContent;
        button.innerHTML = `<span class="btn-text">${buttonText}</span>`;
      }
      
      // Add loading state to form on submit
      if (button.type === 'submit') {
        button.addEventListener('click', () => {
          const isValid = form.checkValidity();
          if (isValid) {
            button.classList.add('loading');
          }
        });
      }
    });
    
    // Enhance form actions container
    const formActions = form.querySelector('.form-actions, .form-buttons, .button-group');
    if (formActions) {
      formActions.classList.add('premium-form-actions');
    }
    
    // Enhance form header
    const formHeader = form.closest('.admin3d-form-container, .form-container')?.querySelector('.form-header');
    if (formHeader) {
      formHeader.classList.add('premium-form-header');
      
      const formTitle = formHeader.querySelector('h2, h3, .form-title');
      if (formTitle) {
        formTitle.classList.add('premium-form-title');
      }
      
      const formSubtitle = formHeader.querySelector('p, .form-subtitle');
      if (formSubtitle) {
        formSubtitle.classList.add('premium-form-subtitle');
      }
    }
    
    // Enhance form sections
    const formSections = form.querySelectorAll('.form-section');
    formSections.forEach(section => {
      section.classList.add('premium-form-section');
      
      const sectionTitle = section.querySelector('h3, h4, .section-title');
      if (sectionTitle) {
        sectionTitle.classList.add('premium-form-section-title');
      }
    });
    
    // Setup form validation
    form.addEventListener('submit', (e) => {
      const invalidFields = form.querySelectorAll(':invalid');
      
      if (invalidFields.length > 0) {
        e.preventDefault();
        
        // Focus the first invalid field
        invalidFields[0].focus();
        
        // Add validation error messages
        invalidFields.forEach(field => {
          const formGroup = field.closest('.premium-form-group');
          
          if (formGroup && !formGroup.querySelector('.premium-form-validation.error')) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'premium-form-validation error';
            errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${field.validationMessage || 'This field is required'}`;
            
            formGroup.appendChild(errorMessage);
            
            // Add error class to input
            field.classList.add('error');
            
            // Remove error message when field becomes valid
            field.addEventListener('input', function validationListener() {
              if (field.validity.valid) {
                field.classList.remove('error');
                
                const validationMessage = formGroup.querySelector('.premium-form-validation.error');
                if (validationMessage) {
                  validationMessage.remove();
                }
                
                field.removeEventListener('input', validationListener);
              }
            });
          }
        });
      }
    });
  });
  
  // Enhance switches
  const switches = document.querySelectorAll('.form-switch, .custom-switch');
  switches.forEach(switchElem => {
    switchElem.classList.add('premium-form-switch');
    
    const switchInput = switchElem.querySelector('input[type="checkbox"]');
    if (switchInput) {
      // Create slider if not exists
      if (!switchElem.querySelector('.premium-form-switch-slider')) {
        const slider = document.createElement('span');
        slider.className = 'premium-form-switch-slider';
        switchElem.appendChild(slider);
      }
    }
  });
}

// Setup input validation with live feedback
function setupInputValidation(input) {
  input.addEventListener('blur', () => {
    validateInput(input);
  });
  
  input.addEventListener('input', () => {
    // Remove previous validation messages
    const formGroup = input.closest('.premium-form-group');
    const validationMessage = formGroup?.querySelector('.premium-form-validation');
    
    if (validationMessage) {
      validationMessage.remove();
    }
    
    // Remove error/success classes
    input.classList.remove('error', 'success');
  });
}

// Validate input and show appropriate message
function validateInput(input) {
  const formGroup = input.closest('.premium-form-group');
  
  if (!formGroup) return;
  
  // Remove previous validation messages
  const existingValidation = formGroup.querySelector('.premium-form-validation');
  if (existingValidation) {
    existingValidation.remove();
  }
  
  // Check validity
  if (input.validity.valid) {
    // Check if input has value
    if (input.value.trim() !== '') {
      input.classList.add('success');
      input.classList.remove('error');
    } else {
      input.classList.remove('success', 'error');
    }
  } else {
    input.classList.add('error');
    input.classList.remove('success');
    
    // Add error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'premium-form-validation error';
    
    let message = 'Invalid input';
    
    if (input.validity.valueMissing) {
      message = 'This field is required';
    } else if (input.validity.typeMismatch) {
      if (input.type === 'email') {
        message = 'Please enter a valid email address';
      } else if (input.type === 'url') {
        message = 'Please enter a valid URL';
      }
    } else if (input.validity.patternMismatch) {
      message = input.title || 'Please match the requested format';
    } else if (input.validity.tooShort) {
      message = `Please use at least ${input.minLength} characters`;
    } else if (input.validity.tooLong) {
      message = `Please use at most ${input.maxLength} characters`;
    } else if (input.validity.rangeUnderflow) {
      message = `Value must be at least ${input.min}`;
    } else if (input.validity.rangeOverflow) {
      message = `Value must be at most ${input.max}`;
    } else if (input.validity.stepMismatch) {
      message = `Value must be a multiple of ${input.step}`;
    }
    
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorMessage);
  }
}