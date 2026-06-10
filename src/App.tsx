import { WoDetailPage } from './components/WoDetailPage'
import { workOrders } from './data/workOrders'

export default function App() {
  // Page 2 focuses on the main urgent WO as the demo "wow moment".
  const wo = workOrders[0]
  return <WoDetailPage wo={wo} />
}
