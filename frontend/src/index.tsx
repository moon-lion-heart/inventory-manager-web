import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

import { Authenticator } from '@aws-amplify/ui-react'; 
// Amplify UI のデフォルトCSSもインポート
import '@aws-amplify/ui-react/styles.css'; 

// Amplify の設定
Amplify.configure(awsExports);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* ★ Authenticator.Provider で App コンポーネントをラップする */}
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </React.StrictMode>
);