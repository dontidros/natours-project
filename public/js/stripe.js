//the key in the brackets is the public key
const stripe = Stripe('pk_test_Sc2ndWcGLLukj1F8NsiOqtJQ00oOkh599Z');

const bookTour = async tourId => {
  try {
    //1. get checkout session from api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    //2. create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }



}

const bookBtn = document.getElementById('book-tour');
if (bookBtn) {
  bookBtn.addEventListener('click', event => {
    event.target.textContent = 'Processing';
    //will bring the value of data-tour-id=`${tour.id}` from tour.pug
    const {
      tourId
    } = event.target.dataset;
    bookTour(tourId);
  })
}