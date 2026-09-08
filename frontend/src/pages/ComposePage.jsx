import Sidebar from '../components/Sidebar.jsx';
import Compose from '../components/Compose.jsx';
import Assistant from '../components/Assistant.jsx';
import SendConfirmation from '../components/SendConfirmation.jsx';
import { useMail } from '../hooks/useMail';

export default function ComposePage() {
  const { replyState } = useMail();

  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <Compose mode={replyState ? 'reply' : 'new'} />
      </main>
      <Assistant />
      <SendConfirmation />
    </div>
  );
}