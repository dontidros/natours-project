const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) {
  showAlert('success', alertMessage);
}