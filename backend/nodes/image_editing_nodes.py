from typing import Tuple
import asyncio


class GrayscaleImage(Node):
    async def run(self, input_image: str) -> str:
        from PIL import Image
        import base64
        from io import BytesIO

        # Extract the base64 data from the data URL
        base64_data = input_image.split(",")[1]

        # Convert base64 to PIL Image
        image_data = base64.b64decode(base64_data)
        img = Image.open(BytesIO(image_data))

        # Convert to grayscale
        grayscale_img = img.convert("L")

        # Convert back to base64
        buffered = BytesIO()
        grayscale_img.save(buffered, format="PNG")
        base64_str = base64.b64encode(buffered.getvalue()).decode()
        img_str = f"data:image/png;base64,{base64_str}"

        # Update the widget with the grayscale image
        display_image = self.widgets[0]  # {"type": "image", "value": ""}
        await self.update_widget("display_image", img_str)

        return img_str
