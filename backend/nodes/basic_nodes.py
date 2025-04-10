from typing import Tuple, Union, List
import asyncio

from node_utils import Node, CaptionedImage, CaptionedVideo


class ShowText(Node):
    async def run(self, text: str) -> str:
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", text)
        return display_text


class String(Node):
    async def run(self) -> str:
        string = self.widgets[0]
        return string


class SaveImage(Node):
    async def run(self, input_image: str) -> str:
        import base64
        import os
        from datetime import datetime
        from io import BytesIO
        from PIL import Image

        # Create output directory if it doesn't exist
        base_output_dir = os.path.join("output")  # Base output directory
        output_dir = self.widgets[0]  # Directory path
        filename = self.widgets[1]  # Base filename (optional)

        full_output_dir = os.path.join(base_output_dir, output_dir)

        if not os.path.exists(full_output_dir):
            os.makedirs(full_output_dir)

        # Extract the base64 data from the data URL
        base64_data = input_image.split(",")[1]

        # Convert base64 to PIL Image
        image_data = base64.b64decode(base64_data)
        img = Image.open(BytesIO(image_data))

        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{timestamp}.png"
        elif not filename.endswith((".png", ".jpg", ".jpeg")):
            filename = f"{filename}.png"

        # Full path for the output file
        output_path = os.path.join(full_output_dir, filename)

        # Save the image
        img.save(output_path)

        # Return the saved file path
        return output_path


class CaptionedVideoSource(Node):
    async def run(self) -> Tuple[str, CaptionedVideo]:
        video_upload = self.widgets[0]  # {"type": "video_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_video = CaptionedVideo(video_upload, caption)
        return video_upload, captioned_video


class CaptionedImageSource(Node):
    async def run(self) -> Tuple[str, CaptionedImage]:
        image_upload = self.widgets[0]  # {"type": "image_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_image = CaptionedImage(image_upload, caption)
        return image_upload, captioned_image
