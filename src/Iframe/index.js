export default function Iframe() {
  // 通过iframe建立沙箱
  return <iframe src="https://google.com" sandbox="allow-scripts allow-forms" width="600"
                 height="400"></iframe>
}
