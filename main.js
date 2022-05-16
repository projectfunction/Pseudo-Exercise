
window.addEventListener('PSEUDO', event => {
	if (event.detail.stage === 'afterRun') {
		window.isEnvironmentReady = true;
	}
});