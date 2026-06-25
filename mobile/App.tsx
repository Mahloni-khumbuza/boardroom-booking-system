import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { notificationService } from './src/shared/services/notification.service';

export default function App() {
  useEffect(() => {
    void notificationService.requestPermissions();
  }, []);

  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
