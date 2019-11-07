//location.reload(true) - forces reload and clean cache
const logout = async () => {

  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    })
    if (res.data.status === 'success') {
      location.reload(true);
    }

  } catch (err) {
    showAlert('error', 'Error logging out, try again')
  }
}
const logoutbtn = document.querySelector('.nav__el--logout ');
if (logoutbtn) {
  logoutbtn.addEventListener('click', logout);
}