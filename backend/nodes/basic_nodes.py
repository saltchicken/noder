from typing import Tuple, Union, List
import asyncio

from node_utils import Node

from dataclasses import dataclass


@dataclass
class CaptionedImage:
    image: str
    caption: str


class OllamaQuery(Node):
    async def run(self) -> Tuple[str, str]:
        from ollama_query import ollama_query

        model_text = self.widgets[0]
        system_message_text = self.widgets[1]
        prompt_text = self.widgets[2]
        host_text = self.widgets[3]
        port_text = self.widgets[4]
        temperature_text = self.widgets[5]
        seed_text = self.widgets[6]

        if system_message_text == "":
            system_message_text = None

        if temperature_text == "":
            temperature_text = None

        if seed_text == "":
            seed_text = None

        response, debug_text = ollama_query(
            model=model_text,
            prompt=prompt_text,
            system_message=system_message_text,
            host=host_text,
            port=port_text,
            temperature=temperature_text,
        )

        return (response, debug_text)


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


class SaveCaptionedImages(Node):
    async def run(
        self, captioned_images: Union[CaptionedImage, List[CaptionedImage]]
    ) -> List[str]:
        import base64
        import os
        from datetime import datetime
        from io import BytesIO
        from PIL import Image

        # Create output directory if it doesn't exist
        base_output_dir = os.path.join("output")  # Base output directory
        output_dir = self.widgets[0]  # Directory path

        full_output_dir = os.path.join(base_output_dir, output_dir)

        if not os.path.exists(full_output_dir):
            os.makedirs(full_output_dir)

        images = (
            [captioned_images]
            if isinstance(captioned_images, CaptionedImage)
            else captioned_images
        )
        saved_paths = []

        for idx, img_data in enumerate(images):
            base64_data = img_data.image.split(",")[1]
            image_data = base64.b64decode(base64_data)
            img = Image.open(BytesIO(image_data))

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{timestamp}_{idx}"

            image_filename = f"{filename}.png"
            output_path = os.path.join(full_output_dir, image_filename)
            img.save(output_path)

            text_filename = f"{filename}.txt"
            text_path = os.path.join(full_output_dir, text_filename)
            with open(text_path, "w") as f:
                f.write(img_data.caption)

            saved_paths.append(output_path)

        return saved_paths


class ShowText(Node):
    async def run(self, text: str) -> str:
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", text)
        return display_text


class MultiInputNode(Node):
    async def run(self, input_values: Union[str, List[str]]) -> str:
        # Handle both single value and list of values
        if isinstance(input_values, list):
            print("This was a list")
            input_values = " ".join(input_values)
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", input_values)


class ImageSource(Node):
    async def run(self) -> str:
        image_upload = self.widgets[0]  # {"type": "image_file_upload", "value": ""}
        return image_upload


class CaptionedImageSource(Node):
    async def run(self) -> CaptionedImage:
        image_upload = self.widgets[0]  # {"type": "image_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_image = CaptionedImage(image_upload, caption)
        return captioned_image


class CaptionedImageSink(Node):
    async def run(self, captioned_image: CaptionedImage):
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", captioned_image.caption)


class TestImageEdit(Node):
    async def run(self) -> str:
        from PIL import Image, ImageDraw
        import base64
        from io import BytesIO

        img = Image.new("RGB", (200, 200), color="white")
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 150, 150], fill="red")

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        base64_str = base64.b64encode(buffered.getvalue()).decode()
        img_str = f"data:image/png;base64,{base64_str}"
        display_image = self.widgets[0]  # {"type": "image", "value": ""}
        await self.update_widget("display_image", img_str)
        return img_str


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


class String(Node):
    async def run(self) -> str:
        string = self.widgets[0]
        return string
