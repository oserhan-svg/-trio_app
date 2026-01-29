import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("WhatsApp Component Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 bg-red-50 text-center">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 max-w-2xl w-full">
                        <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center justify-center gap-2">
                            ⚠️ Uygulama Hatası (WhatsApp Modülü)
                        </h2>
                        <p className="text-gray-600 mb-4 text-sm">
                            Bu bileşende beklenmeyen bir hata oluştu. Lütfen aşağıdaki hata detayını teknik ekibe iletin:
                        </p>
                        <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left overflow-auto max-h-60 text-xs font-mono mb-4">
                            <p className="font-bold text-white mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                        >
                            Sayfayı Yenile
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
