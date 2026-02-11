import AppHeader from './AppHeader';



const DefaultLayout = ({ children }) => {
	return (
		<>
			
			<AppHeader />
			<div
				className="pwa-safe-bottom"
				style={{
					paddingLeft: 'max(0px, env(safe-area-inset-left))',
					paddingRight: 'max(0px, env(safe-area-inset-right))',
				}}
			>
				{children}
			</div>
			
		</>
	);
};

export default DefaultLayout;
